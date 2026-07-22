import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runSyntheticValidationFoundation, validateSyntheticValidationFoundation } from "@/services/synthetic-validation-foundation";
import type {
  SyntheticEnvironmentArchitectureBundle,
  SyntheticEnvironmentArchitectureInput,
  SyntheticEnvironmentArchitectureResult,
  SyntheticEnvironmentArchitectureValidation,
  SyntheticEnvironmentAuditLedgerEntry,
  SyntheticEnvironmentFailure,
  SyntheticEnvironmentInvariant,
  SyntheticEnvironmentLifecycleState,
  SyntheticEnvironmentOutcome,
  SyntheticEnvironmentQualificationOutcome,
  SyntheticEnvironmentScenario,
  SyntheticEnvironmentType,
} from "@/types/synthetic-environment-architecture";

const VERSION = "synthetic-environment-architecture/v14.2" as const;
const IDENTIFIER = "SyntheticEnvironmentArchitecture" as const;
const TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;
const DEFAULT_TENANT = "tenant_mission_control_foundation";
const DEFAULT_OWNER = "environment-governance-authority";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function directFailure(scenario: SyntheticEnvironmentScenario): SyntheticEnvironmentFailure | undefined { return scenario === "BASELINE" || scenario === "CONDITIONAL_QUALIFICATION" ? undefined : scenario; }
function has(failures: readonly SyntheticEnvironmentFailure[], failure: SyntheticEnvironmentFailure): boolean { return failures.includes(failure); }
function outcomeFor(failures: readonly SyntheticEnvironmentFailure[]): SyntheticEnvironmentOutcome { return failures.length ? "REJECTED" : "APPROVED"; }

const environmentTypes = freezeArray(["DEVELOPMENT", "VALIDATION", "REPLAY", "CERTIFICATION", "STRESS_TEST", "CHAOS_TEST", "ADVERSARIAL_TEST", "SCALE_TEST", "FAILURE_SIMULATION", "COMPLIANCE_TEST"] as const satisfies readonly SyntheticEnvironmentType[]);
const lifecycleStates = freezeArray(["DEFINED", "REGISTERED", "CONFIGURED", "QUALIFIED", "ACTIVE", "SUSPENDED", "RETIRED", "ARCHIVED"] as const satisfies readonly SyntheticEnvironmentLifecycleState[]);
const qualificationOutcomes = freezeArray(["QUALIFIED", "CONDITIONALLY_QUALIFIED", "DISQUALIFIED"] as const satisfies readonly SyntheticEnvironmentQualificationOutcome[]);

function resultReplayHash(result: Omit<SyntheticEnvironmentArchitectureResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    foundation: result.foundation_ref,
    contract: result.contract.integrity_hash,
    registry: result.registry.map((entry) => entry.integrity_hash),
    environment: result.environment.integrity_hash,
    lifecycle: result.lifecycle.integrity_hash,
    versions: result.version_registry.map((entry) => entry.integrity_hash),
    configuration: result.configuration.integrity_hash,
    qualification: result.qualification.integrity_hash,
    isolation: result.isolation.integrity_hash,
    replay: result.replay.integrity_hash,
    governance: result.governance.integrity_hash,
    audit: result.audit_ledger.map((entry) => entry.integrity_hash),
    invariants: result.invariants.map((entry) => entry.integrity_hash),
    outcome: result.outcome,
  });
}

function resultIntegrityHash(result: Omit<SyntheticEnvironmentArchitectureResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash });
}

function invariant(invariant_id: SyntheticEnvironmentInvariant["invariant_id"], name: string, satisfied: boolean, failure_reason: SyntheticEnvironmentFailure | null): SyntheticEnvironmentInvariant {
  return nested({ invariant_id, name, satisfied, failure_reason });
}

function ledger(event_type: SyntheticEnvironmentAuditLedgerEntry["event_type"], environment_id: string, sequence: number, evidence_refs: readonly string[], mutable: boolean): SyntheticEnvironmentAuditLedgerEntry {
  const entry = nested({ ledger_entry_id: id("synthetic_env_ledger", { event_type, environment_id, sequence }), event_type, environment_id, sequence, evidence_refs, immutable: !mutable, replayable: true });
  return mutable ? Object.freeze({ ...entry, integrity_hash: hash({ mutable: entry.ledger_entry_id }) }) : entry;
}

export function runSyntheticEnvironmentArchitecture(input: SyntheticEnvironmentArchitectureInput = {}): SyntheticEnvironmentArchitectureResult {
  const foundation = runSyntheticValidationFoundation();
  const foundationValid = validateSyntheticValidationFoundation(foundation).valid;
  const direct = directFailure(input.scenario ?? "BASELINE");
  const failures = freezeArray([...new Set([...(foundationValid ? [] : ["FOUNDATION_NOT_APPROVED" as const]), ...(direct ? [direct] : [])])]);
  const conditional = input.scenario === "CONDITIONAL_QUALIFICATION";
  const tenant = has(failures, "TENANT_ISOLATION_BREACH") ? `${input.tenant_scope ?? DEFAULT_TENANT}:foreign` : input.tenant_scope ?? DEFAULT_TENANT;
  const owner = has(failures, "IDENTITY_MUTATION") ? `${input.owner ?? DEFAULT_OWNER}:mutated` : input.owner ?? DEFAULT_OWNER;
  const environmentType = input.environment_type ?? "VALIDATION";
  const environmentId = id("synthetic_environment", { tenant, environmentType, name: input.environment_name ?? "Phase 14 Deterministic Environment" });
  const versionId = id("environment_version", { environmentId, version: "1.0.0" });
  const configurationVersion = id("environment_configuration", { versionId, frozen: true });
  const qualificationStatus: SyntheticEnvironmentQualificationOutcome = failures.length ? "DISQUALIFIED" : conditional ? "CONDITIONALLY_QUALIFIED" : "QUALIFIED";
  const activeAllowed = qualificationStatus === "QUALIFIED";

  const contract = nested({
    contract_version: VERSION,
    synthetic_validation_contract_ref: foundation.integrity_hash,
    deterministic_identity_required: !has(failures, "IDENTITY_MUTATION"),
    immutable_lifecycle_required: true,
    reproducible_configuration_required: !has(failures, "NON_DETERMINISTIC_CONFIGURATION"),
    qualification_required_before_use: !has(failures, "UNQUALIFIED_ACTIVATION"),
    tenant_isolation_required: !has(failures, "TENANT_ISOLATION_BREACH"),
    execution_isolation_required: !has(failures, "EXECUTION_ISOLATION_BREACH"),
    production_isolation_required: true,
    advisory_only: !has(failures, "ADVISORY_BOUNDARY_BREACH"),
    operational_execution_authority: false as const,
    allowed_environment_types: environmentTypes,
    lifecycle_states: lifecycleStates,
  });

  const configuration = nested({
    configuration_id: configurationVersion,
    runtime_configuration: "nodejs-deterministic-runtime",
    infrastructure_profile: has(failures, "CONFIGURATION_INCOMPLETE") ? "" : "isolated-synthetic-profile",
    dependency_versions: freezeArray(has(failures, "DEPENDENCY_INTEGRITY_FAILURE") ? ["unverified"] : ["node:20.x", "vitest:4.1.2", "mission-control-synthetic-runtime:14.2"]),
    service_topology: freezeArray(has(failures, "CONFIGURATION_INCOMPLETE") ? [] : ["validation-controller", "replay-controller", "audit-ledger"]),
    seed_configuration: has(failures, "NON_DETERMINISTIC_CONFIGURATION") ? "runtime-random" : "seed:phase-14.2:canonical",
    deterministic_execution_parameters: freezeArray(has(failures, "NON_DETERMINISTIC_CONFIGURATION") ? [] : ["stable-sort", "fixed-clock", "canonical-hash", "single-writer-ledger"]),
    tenant_isolation_settings: freezeArray(has(failures, "TENANT_ISOLATION_BREACH") ? [] : ["tenant-scoped-storage", "tenant-scoped-credentials", "tenant-scoped-artifacts"]),
    security_profile: has(failures, "SECURITY_CONTROL_FAILURE") ? "" : "zero-trust-synthetic-profile",
    governance_configuration: has(failures, "GOVERNANCE_NOT_APPROVED") ? "" : "constitutional-environment-governance",
    immutable_after_qualification: !has(failures, "VERSION_MUTATION"),
  });

  const qualification = nested({
    qualification_id: id("environment_qualification", environmentId),
    outcome: qualificationStatus,
    configuration_complete: !has(failures, "CONFIGURATION_INCOMPLETE"),
    dependencies_verified: !has(failures, "DEPENDENCY_INTEGRITY_FAILURE"),
    deterministic_configuration: !has(failures, "NON_DETERMINISTIC_CONFIGURATION"),
    replay_ready: !has(failures, "REPLAY_DIVERGENCE"),
    security_verified: !has(failures, "SECURITY_CONTROL_FAILURE"),
    governance_compliant: !has(failures, "GOVERNANCE_NOT_APPROVED") && foundationValid,
    tenant_isolation_verified: !has(failures, "TENANT_ISOLATION_BREACH"),
    constitutional_constraints_satisfied: !has(failures, "ADVISORY_BOUNDARY_BREACH") && !has(failures, "FOUNDATION_NOT_APPROVED"),
    evidence_refs: freezeArray([configuration.integrity_hash, foundation.integrity_hash]),
  });

  const isolation = nested({
    isolation_id: id("environment_isolation", environmentId),
    tenant_isolation: !has(failures, "TENANT_ISOLATION_BREACH"),
    execution_isolation: !has(failures, "EXECUTION_ISOLATION_BREACH"),
    storage_isolation: !has(failures, "TENANT_ISOLATION_BREACH"),
    network_isolation: !has(failures, "EXECUTION_ISOLATION_BREACH"),
    credential_isolation: !has(failures, "TENANT_ISOLATION_BREACH"),
    artifact_isolation: !has(failures, "EXECUTION_ISOLATION_BREACH"),
    replay_isolation: !has(failures, "REPLAY_DIVERGENCE"),
    governance_isolation: !has(failures, "GOVERNANCE_NOT_APPROVED"),
    boundary_violations: freezeArray([...(has(failures, "TENANT_ISOLATION_BREACH") ? ["cross-tenant access"] : []), ...(has(failures, "EXECUTION_ISOLATION_BREACH") ? ["cross-environment artifact leakage"] : [])]),
  });

  const replay = nested({
    replay_id: id("environment_replay", environmentId),
    identical_configuration: !has(failures, "REPLAY_DIVERGENCE") && !has(failures, "NON_DETERMINISTIC_CONFIGURATION"),
    identical_dependency_versions: !has(failures, "DEPENDENCY_INTEGRITY_FAILURE"),
    identical_execution_ordering: !has(failures, "NON_DETERMINISTIC_CONFIGURATION"),
    identical_environment_state: !has(failures, "REPLAY_DIVERGENCE"),
    identical_qualification_state: qualificationStatus !== "DISQUALIFIED",
    identical_governance_evaluation: !has(failures, "GOVERNANCE_NOT_APPROVED"),
    divergence_is_constitutional_event: true,
    deterministic: !has(failures, "REPLAY_DIVERGENCE") && !has(failures, "NON_DETERMINISTIC_CONFIGURATION"),
  });

  const governance = nested({
    governance_validation_id: id("environment_governance", environmentId),
    canonical_owner: !has(failures, "IDENTITY_MUTATION"),
    qualification_prior_to_activation: activeAllowed && !has(failures, "UNQUALIFIED_ACTIVATION"),
    immutable_lineage_preserved: !has(failures, "VERSION_MUTATION"),
    immutable_audit_history_preserved: !has(failures, "AUDIT_LEDGER_MUTABLE"),
    replay_compatibility_preserved: !has(failures, "REPLAY_DIVERGENCE"),
    unauthorized_modification_prohibited: !has(failures, "VERSION_MUTATION"),
    constitutional_constraints_preserved: !has(failures, "GOVERNANCE_NOT_APPROVED") && foundationValid,
    advisory_only_boundary_maintained: !has(failures, "ADVISORY_BOUNDARY_BREACH"),
  });

  const environment = nested({
    environment_id: environmentId,
    environment_name: input.environment_name ?? "Phase 14 Deterministic Environment",
    environment_type: environmentType,
    version_id: versionId,
    configuration_version: configurationVersion,
    lifecycle_state: activeAllowed || has(failures, "UNQUALIFIED_ACTIVATION") ? "ACTIVE" as const : "QUALIFIED" as const,
    qualification_status: qualificationStatus,
    qualification_refs: freezeArray([qualification.integrity_hash]),
    tenant_scope: tenant,
    isolation_profile: isolation.isolation_id,
    replay_refs: freezeArray([replay.integrity_hash]),
    governance_refs: freezeArray([governance.integrity_hash]),
    integrity_hash: configuration.integrity_hash,
    created_by: owner,
    created_timestamp: TIMESTAMP,
    retired_timestamp: null,
    archived_timestamp: null,
  });

  const environmentRecord = nested({ ...environment, integrity_hash: undefined as never });
  const version = nested({
    version_id: has(failures, "VERSION_MUTATION") ? `${versionId}:mutated` : versionId,
    parent_version: null,
    configuration_lineage: freezeArray(has(failures, "CONFIGURATION_INCOMPLETE") ? [] : [configuration.integrity_hash]),
    change_rationale: "Initial deterministic synthetic environment architecture.",
    compatibility_status: qualificationStatus === "QUALIFIED" ? "COMPATIBLE" as const : conditional ? "CONDITIONALLY_COMPATIBLE" as const : "INCOMPATIBLE" as const,
    replay_compatibility: !has(failures, "REPLAY_DIVERGENCE"),
    qualification_status: qualificationStatus,
    supersession_history: freezeArray([]),
    immutable: !has(failures, "VERSION_MUTATION"),
  });
  const lifecycle = nested({ lifecycle_id: id("environment_lifecycle", VERSION), states: lifecycleStates, transition_order: lifecycleStates, invalid_transitions_rejected: !has(failures, "UNQUALIFIED_ACTIVATION"), lifecycle_replayable: !has(failures, "REPLAY_DIVERGENCE") });
  const audit_ledger = freezeArray((["REGISTERED", "CONFIGURATION_VALIDATED", "QUALIFICATION_DECIDED", "LIFECYCLE_TRANSITIONED", "REPLAY_VALIDATED", "GOVERNANCE_APPROVED", "INTEGRITY_VALIDATED", "RETIREMENT_RECORDED"] as const).map((event, index) => ledger(event, environmentId, index + 1, [environmentRecord.integrity_hash, qualification.integrity_hash], has(failures, "AUDIT_LEDGER_MUTABLE") && index === 7)));
  const invariants = freezeArray([
    invariant("SIA-001", "Identity Immutability", !has(failures, "IDENTITY_MUTATION"), "IDENTITY_MUTATION"),
    invariant("SIA-002", "Version Immutability", !has(failures, "VERSION_MUTATION"), "VERSION_MUTATION"),
    invariant("SIA-003", "Qualification Before Execution", activeAllowed && !has(failures, "UNQUALIFIED_ACTIVATION"), "UNQUALIFIED_ACTIVATION"),
    invariant("SIA-004", "Replay Determinism", replay.deterministic, "REPLAY_DIVERGENCE"),
    invariant("SIA-005", "Isolation Enforcement", isolation.execution_isolation, "EXECUTION_ISOLATION_BREACH"),
    invariant("SIA-006", "Tenant Isolation", isolation.tenant_isolation, "TENANT_ISOLATION_BREACH"),
    invariant("SIA-007", "Governance Preservation", governance.constitutional_constraints_preserved, "GOVERNANCE_NOT_APPROVED"),
    invariant("SIA-008", "Audit Immutability", governance.immutable_audit_history_preserved, "AUDIT_LEDGER_MUTABLE"),
    invariant("SIA-009", "Configuration Integrity", configuration.immutable_after_qualification && qualification.configuration_complete, "CONFIGURATION_INCOMPLETE"),
    invariant("SIA-010", "Advisory-Only Boundary", contract.advisory_only && contract.operational_execution_authority === false, "ADVISORY_BOUNDARY_BREACH"),
  ].map((item) => item.satisfied ? nested({ ...item, failure_reason: null }) : item));
  const effectiveFailures = freezeArray([...new Set([...failures, ...invariants.map((item) => item.failure_reason).filter((failure): failure is SyntheticEnvironmentFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<SyntheticEnvironmentArchitectureResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, foundation_ref: foundation.integrity_hash, contract, registry: freezeArray([environmentRecord]), environment: environmentRecord, lifecycle, version_registry: freezeArray([version]), configuration, qualification, isolation, replay, governance, audit_ledger, invariants, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateSyntheticEnvironmentArchitecture(result = runSyntheticEnvironmentArchitecture()): SyntheticEnvironmentArchitectureValidation {
  const contract_valid = verify(result.contract) && result.contract.advisory_only && result.contract.operational_execution_authority === false && result.contract.allowed_environment_types.every((type) => environmentTypes.includes(type));
  const registry_valid = result.registry.length === 1 && result.registry.every((entry) => verify(entry) && environmentTypes.includes(entry.environment_type) && entry.environment_id === result.environment.environment_id && entry.tenant_scope === result.environment.tenant_scope);
  const lifecycle_valid = verify(result.lifecycle) && result.lifecycle.states.join(">") === lifecycleStates.join(">") && result.lifecycle.invalid_transitions_rejected && result.lifecycle.lifecycle_replayable;
  const version_valid = result.version_registry.every((entry) => verify(entry) && entry.immutable && entry.version_id === result.environment.version_id && entry.configuration_lineage.length > 0 && entry.replay_compatibility);
  const configuration_valid = verify(result.configuration) && Boolean(result.configuration.infrastructure_profile) && result.configuration.dependency_versions.every((dependency) => dependency !== "unverified") && result.configuration.deterministic_execution_parameters.length > 0 && result.configuration.immutable_after_qualification;
  const qualification_valid = verify(result.qualification) && result.qualification.outcome === "QUALIFIED" && result.qualification.configuration_complete && result.qualification.dependencies_verified && result.qualification.deterministic_configuration && result.qualification.replay_ready && result.qualification.security_verified && result.qualification.governance_compliant && result.qualification.tenant_isolation_verified && result.qualification.constitutional_constraints_satisfied;
  const isolation_valid = verify(result.isolation) && result.isolation.boundary_violations.length === 0 && result.isolation.tenant_isolation && result.isolation.execution_isolation && result.isolation.storage_isolation && result.isolation.network_isolation && result.isolation.credential_isolation && result.isolation.artifact_isolation && result.isolation.replay_isolation && result.isolation.governance_isolation;
  const replay_valid = verify(result.replay) && result.replay.deterministic && result.replay.identical_configuration && result.replay.identical_dependency_versions && result.replay.identical_execution_ordering && result.replay.identical_environment_state && result.replay.identical_qualification_state && result.replay.identical_governance_evaluation;
  const governance_valid = verify(result.governance) && Object.entries(result.governance).filter(([key]) => !key.endsWith("_id") && key !== "integrity_hash").every(([, value]) => value === true);
  const audit_valid = result.audit_ledger.length === 8 && result.audit_ledger.every((entry, index) => verify(entry) && entry.sequence === index + 1 && entry.immutable && entry.replayable);
  const invariants_valid = result.invariants.length === 10 && result.invariants.every((entry) => verify(entry) && entry.satisfied && entry.failure_reason === null);
  const integrityValid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "APPROVED" && integrityValid && contract_valid && registry_valid && lifecycle_valid && version_valid && configuration_valid && qualification_valid && isolation_valid && replay_valid && governance_valid && audit_valid && invariants_valid;
  return nested({ valid, outcome: result.outcome, contract_valid, registry_valid, lifecycle_valid, version_valid, configuration_valid, qualification_valid, isolation_valid, replay_valid, governance_valid, audit_valid, invariants_valid, failures: result.failures });
}

export function replaySyntheticEnvironmentArchitecture(result = runSyntheticEnvironmentArchitecture()): boolean {
  const replayed = runSyntheticEnvironmentArchitecture();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateSyntheticEnvironmentArchitecture(result).valid;
}

export function getSyntheticEnvironmentArchitectureBundle(): SyntheticEnvironmentArchitectureBundle {
  const result = runSyntheticEnvironmentArchitecture();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, foundation_phase: "synthetic-validation-foundation/v14.1" as const, qualification_outcomes: qualificationOutcomes, environment_types: environmentTypes, constitutional_invariants: freezeArray(["SIA-001", "SIA-002", "SIA-003", "SIA-004", "SIA-005", "SIA-006", "SIA-007", "SIA-008", "SIA-009", "SIA-010"] as const) }), result, validation: validateSyntheticEnvironmentArchitecture(result) });
}

export const SyntheticEnvironmentArchitectureService = Object.freeze({ run: runSyntheticEnvironmentArchitecture, validate: validateSyntheticEnvironmentArchitecture, replay: replaySyntheticEnvironmentArchitecture });
