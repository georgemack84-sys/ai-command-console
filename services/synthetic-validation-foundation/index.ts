import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  SyntheticValidationFailure,
  SyntheticValidationFoundationBundle,
  SyntheticValidationFoundationResult,
  SyntheticValidationFoundationValidation,
  SyntheticValidationInput,
  SyntheticValidationOutcome,
  SyntheticValidationScenario,
  SyntheticValidationScopeCategory,
  SyntheticValidationStatus,
} from "@/types/synthetic-validation-foundation";

const VERSION = "synthetic-validation-foundation/v14.1" as const;
const IDENTIFIER = "SyntheticValidationFoundation" as const;
const TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;
const DEFAULT_TENANT = "tenant_mission_control_foundation";
const DEFAULT_OWNER = "constitutional-governance-authority";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function scenarioFailure(scenario: SyntheticValidationScenario): SyntheticValidationFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly SyntheticValidationFailure[], failure: SyntheticValidationFailure): boolean { return failures.includes(failure); }
function outcomeFor(failures: readonly SyntheticValidationFailure[]): SyntheticValidationOutcome { return failures.length ? "REJECTED" : "APPROVED"; }

const lifecycleStates = freezeArray(["REGISTERED", "CONFIGURED", "VALIDATED", "AUTHORIZED", "EXECUTING", "COMPLETED", "REPLAYABLE", "ARCHIVED"] as const satisfies readonly SyntheticValidationStatus[]);
const scopeCategories = freezeArray(["MISSION_VALIDATION", "STRATEGY_VALIDATION", "RECOMMENDATION_VALIDATION", "GOVERNANCE_VALIDATION", "POLICY_VALIDATION", "RISK_VALIDATION", "CONFIDENCE_VALIDATION", "REPLAY_VALIDATION", "RESILIENCE_VALIDATION", "SCALE_VALIDATION", "ADVERSARIAL_VALIDATION"] as const satisfies readonly SyntheticValidationScopeCategory[]);
const authorityOrder = Object.freeze(["CONSTITUTION", "GOVERNANCE_AUTHORITY", "OPERATOR_AUTHORITY", "SYNTHETIC_VALIDATION"] as const);

function resultReplayHash(result: Omit<SyntheticValidationFoundationResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    contract: result.contract.integrity_hash,
    lifecycle: result.lifecycle.integrity_hash,
    registry: result.registry_entry.integrity_hash,
    identity: result.identity_record.integrity_hash,
    governance: result.governance.integrity_hash,
    replay: result.replay.integrity_hash,
    deterministic: result.deterministic_execution.integrity_hash,
    outcome: result.outcome,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<SyntheticValidationFoundationResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash });
}

export function runSyntheticValidationFoundation(input: SyntheticValidationInput = {}): SyntheticValidationFoundationResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const failures = freezeArray(direct ? [direct] : []);
  const tenantId = has(failures, "TENANT_ISOLATION_BREACH") ? `${input.tenant_id ?? DEFAULT_TENANT}:foreign` : input.tenant_id ?? DEFAULT_TENANT;
  const owner = has(failures, "IDENTITY_MUTATION") ? `${input.owner ?? DEFAULT_OWNER}:mutated` : input.owner ?? DEFAULT_OWNER;
  const validationScope = input.validation_scope ?? "MISSION_VALIDATION";

  const contract = nested({
    contract_version: VERSION,
    definition: "Synthetic validation is deterministic, replayable, tenant-isolated advisory assessment performed under constitutional and governance authority.",
    constitutional_authority_order: authorityOrder,
    advisory_only: !has(failures, "ADVISORY_BOUNDARY_BREACH") && !has(failures, "UNAUTHORIZED_OPERATIONAL_ACTION"),
    deterministic_execution_required: !has(failures, "NON_DETERMINISTIC_EXECUTION"),
    replay_required: !has(failures, "REPLAY_PACKAGE_INCOMPLETE"),
    audit_required: !has(failures, "AUDIT_INCOMPLETE"),
    governance_approval_required: !has(failures, "GOVERNANCE_NOT_APPROVED"),
    tenant_isolation_required: !has(failures, "TENANT_ISOLATION_BREACH"),
    operational_execution_allowed: false as const,
  });

  const lifecycle = nested({
    lifecycle_id: id("synthetic_lifecycle", VERSION),
    states: lifecycleStates,
    transition_order: lifecycleStates,
    cannot_skip_stages: !has(failures, "INVALID_LIFECYCLE_TRANSITION"),
    cannot_regress_without_governed_replay: !has(failures, "INVALID_LIFECYCLE_TRANSITION"),
    cannot_execute_before_authorization: !has(failures, "GOVERNANCE_NOT_APPROVED") && !has(failures, "INVALID_LIFECYCLE_TRANSITION"),
    completed_results_immutable: !has(failures, "IDENTITY_MUTATION"),
    archive_requires_replay_certification: !has(failures, "REPLAY_PACKAGE_INCOMPLETE"),
    invalid_transitions: freezeArray(has(failures, "INVALID_LIFECYCLE_TRANSITION") ? ["REGISTERED->EXECUTING", "COMPLETED->CONFIGURED"] : []),
  });

  const validationId = id("synthetic_validation", { tenantId, validationScope, name: input.validation_name ?? "Phase 14 Foundation Validation" });
  const policyRef = has(failures, "MISSING_POLICY_MANIFEST") ? "" : id("policy_manifest", { tenantId, validationScope });
  const governanceRef = has(failures, "MISSING_GOVERNANCE_CONTEXT") || has(failures, "GOVERNANCE_NOT_APPROVED") ? "" : id("governance_context", { tenantId, owner });
  const lineageRef = has(failures, "LINEAGE_INCOMPLETE") ? "" : id("lineage", validationId);
  const auditRef = has(failures, "AUDIT_INCOMPLETE") ? "" : id("audit", validationId);
  const replayRef = has(failures, "REPLAY_PACKAGE_INCOMPLETE") ? "" : id("replay_package", validationId);

  const registry_entry = nested({
    validation_id: validationId,
    validation_name: input.validation_name ?? "Phase 14 Foundation Validation",
    validation_type: "SYNTHETIC_VALIDATION" as const,
    tenant_id: tenantId,
    mission_scope: "MISSION_CONTROL_PHASE_14",
    validation_scope: validationScope,
    objectives: freezeArray(["define constitutional validation boundaries", "preserve deterministic lifecycle", "bind governance and replay obligations"]),
    simulation_targets: freezeArray(["synthetic-validation-contract", "validation-lifecycle", "scope-registry", "identity-model"]),
    policy_manifest_ref: policyRef,
    governance_scope: governanceRef,
    replay_scope: replayRef,
    owner,
    creation_timestamp: TIMESTAMP,
  });

  const identity_record = nested({
    validation_id: validationId,
    validation_name: registry_entry.validation_name,
    validation_version: "14.1" as const,
    tenant_id: tenantId,
    mission_scope: registry_entry.mission_scope,
    validation_type: "SYNTHETIC_VALIDATION" as const,
    validation_scope: validationScope,
    validation_status: "REPLAYABLE" as const,
    owner,
    policy_manifest_ref: policyRef,
    governance_context_ref: governanceRef,
    execution_profile_ref: id("execution_profile", { validationId, deterministic: true }),
    configuration_ref: id("configuration", { validationId, frozen: true }),
    replay_package_ref: replayRef,
    lineage_ref: lineageRef,
    audit_ref: auditRef,
    origin_ref: id("origin", VERSION),
    created_timestamp: TIMESTAMP,
    completed_timestamp: TIMESTAMP,
  });

  const governance = nested({
    governance_model_id: id("synthetic_governance", validationId),
    approved_governance: !has(failures, "GOVERNANCE_NOT_APPROVED") && Boolean(governanceRef),
    authority_hierarchy_preserved: !has(failures, "AUTHORITY_HIERARCHY_BREACH"),
    tenant_isolation_enforced: !has(failures, "TENANT_ISOLATION_BREACH"),
    unauthorized_execution_rejected: !has(failures, "UNAUTHORIZED_OPERATIONAL_ACTION"),
    fail_closed_on_governance_violation: !has(failures, "GOVERNANCE_NOT_APPROVED"),
    immutable_audit_preserved: !has(failures, "AUDIT_INCOMPLETE"),
    replay_ownership_preserved: !has(failures, "REPLAY_PACKAGE_INCOMPLETE"),
  });

  const replay = nested({
    replay_model_id: id("synthetic_replay", validationId),
    preserves_configuration: !has(failures, "REPLAY_PACKAGE_INCOMPLETE"),
    preserves_execution_ordering: !has(failures, "NON_DETERMINISTIC_EXECUTION"),
    preserves_dependency_graph: !has(failures, "REPLAY_PACKAGE_INCOMPLETE"),
    preserves_governance_decisions: !has(failures, "MISSING_GOVERNANCE_CONTEXT") && !has(failures, "REPLAY_PACKAGE_INCOMPLETE"),
    preserves_policy_manifest: !has(failures, "MISSING_POLICY_MANIFEST") && !has(failures, "REPLAY_PACKAGE_INCOMPLETE"),
    preserves_evidence_inputs: !has(failures, "REPLAY_PACKAGE_INCOMPLETE"),
    preserves_outputs: !has(failures, "REPLAY_PACKAGE_INCOMPLETE"),
    preserves_integrity_verification: !has(failures, "REPLAY_PACKAGE_INCOMPLETE"),
    preserves_lifecycle_transitions: !has(failures, "INVALID_LIFECYCLE_TRANSITION") && !has(failures, "REPLAY_PACKAGE_INCOMPLETE"),
    preserves_audit_history: !has(failures, "AUDIT_INCOMPLETE") && !has(failures, "REPLAY_PACKAGE_INCOMPLETE"),
    reproducible: !has(failures, "REPLAY_PACKAGE_INCOMPLETE") && !has(failures, "NON_DETERMINISTIC_EXECUTION"),
  });

  const deterministic_execution = nested({
    scheduling: true as const,
    dependency_ordering: true as const,
    policy_binding: true as const,
    governance_resolution: true as const,
    evidence_qualification: true as const,
    state_transitions: true as const,
    completion_semantics: true as const,
  });
  const advisory_constraints = freezeArray(["never authorize execution", "never deploy software", "never modify operational systems", "never bypass governance", "never override operator decisions", "never expand authority", "never initiate external actions", "never mutate production state"]);
  const outcome = outcomeFor(failures);
  const base: Omit<SyntheticValidationFoundationResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, contract, lifecycle, registry_entry, identity_record, governance, replay, deterministic_execution, advisory_constraints, failures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateSyntheticValidationFoundation(result = runSyntheticValidationFoundation()): SyntheticValidationFoundationValidation {
  const contract_valid = verify(result.contract) && result.contract.advisory_only && result.contract.operational_execution_allowed === false && result.contract.constitutional_authority_order[0] === "CONSTITUTION" && result.contract.constitutional_authority_order[3] === "SYNTHETIC_VALIDATION";
  const lifecycle_valid = verify(result.lifecycle) && result.lifecycle.states.join(">") === lifecycleStates.join(">") && result.lifecycle.cannot_skip_stages && result.lifecycle.cannot_execute_before_authorization && result.lifecycle.archive_requires_replay_certification && result.lifecycle.invalid_transitions.length === 0;
  const registry_valid = verify(result.registry_entry) && scopeCategories.includes(result.registry_entry.validation_scope) && Boolean(result.registry_entry.validation_id) && Boolean(result.registry_entry.tenant_id) && Boolean(result.registry_entry.policy_manifest_ref) && Boolean(result.registry_entry.governance_scope);
  const identity_valid = verify(result.identity_record) && result.identity_record.validation_id === result.registry_entry.validation_id && result.identity_record.tenant_id === result.registry_entry.tenant_id && result.identity_record.owner === result.registry_entry.owner && Boolean(result.identity_record.lineage_ref) && Boolean(result.identity_record.replay_package_ref) && Boolean(result.identity_record.governance_context_ref);
  const governance_valid = verify(result.governance) && result.governance.approved_governance && result.governance.authority_hierarchy_preserved && result.governance.tenant_isolation_enforced && result.governance.unauthorized_execution_rejected && result.governance.fail_closed_on_governance_violation;
  const replay_valid = verify(result.replay) && result.replay.reproducible && result.replay.preserves_configuration && result.replay.preserves_governance_decisions && result.replay.preserves_policy_manifest && result.replay.preserves_audit_history;
  const deterministic_valid = verify(result.deterministic_execution) && Object.entries(result.deterministic_execution).filter(([key]) => key !== "integrity_hash").every(([, value]) => value === true);
  const advisory_valid = result.advisory_constraints.length === 8 && result.advisory_constraints.every((constraint) => constraint.startsWith("never"));
  const integrityValid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "APPROVED" && integrityValid && contract_valid && lifecycle_valid && registry_valid && identity_valid && governance_valid && replay_valid && deterministic_valid && advisory_valid;
  return nested({ valid, outcome: result.outcome, contract_valid, lifecycle_valid, registry_valid, identity_valid, governance_valid, replay_valid, deterministic_valid, advisory_valid, failures: result.failures });
}

export function replaySyntheticValidationFoundation(result = runSyntheticValidationFoundation()): boolean {
  const replayed = runSyntheticValidationFoundation();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateSyntheticValidationFoundation(result).valid;
}

export function getSyntheticValidationFoundationBundle(): SyntheticValidationFoundationBundle {
  const result = runSyntheticValidationFoundation();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      constitutional_root_for_phase_14: true,
      advisory_only_boundary_immutable: true,
      deterministic_lifecycle_required: true,
      immutable_identity_required: true,
      replay_required_before_archive: true,
      foundation_for: freezeArray(["Phase 14.2 Synthetic Environment Architecture", "Phase 14.3 Synthetic Scenario Generation", "Phase 14.4 Synthetic Mission Execution", "Phase 14.5 Validation Replay", "Phase 14.6 Adversarial Validation", "Phase 14.7 Multi-Tenant Synthetic Isolation", "Phase 14.8 Scale & Stress Validation", "Phase 14.9 Operational Readiness Validation", "Phase 14.10 Synthetic Certification", "Phase 14.11 Observability & Operations", "Phase 14.12 Governance, Security & Authority Enforcement", "Phase 14.13 Lineage, Replay, Integrity & Explainability", "Phase 14.14 Phase 14 Certification Gate"]),
    }),
    result,
    validation: validateSyntheticValidationFoundation(result),
  });
}

export const SyntheticValidationFoundationService = Object.freeze({ run: runSyntheticValidationFoundation, validate: validateSyntheticValidationFoundation, replay: replaySyntheticValidationFoundation });
