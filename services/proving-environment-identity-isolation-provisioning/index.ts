import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runProvingArchitectureEnvironmentFoundation, validateProvingArchitectureEnvironmentFoundation } from "@/services/proving-architecture-environment-foundation";
import type {
  ProvingIdentityKind,
  ProvingIdentityRecord,
  ProvingProvisioningBundle,
  ProvingProvisioningFailure,
  ProvingProvisioningInput,
  ProvingProvisioningInvariant,
  ProvingProvisioningOutcome,
  ProvingProvisioningResult,
  ProvingProvisioningScenario,
  ProvingProvisioningValidation,
} from "@/types/proving-environment-identity-isolation-provisioning";

const VERSION = "proving-environment-identity-isolation-provisioning/v6.2" as const;
const IDENTIFIER = "ProvingEnvironmentIdentityIsolationProvisioning" as const;
const NOW = "2026-07-19T00:00:00.000Z";
const LIFECYCLE = Object.freeze(["REQUESTED", "PROVISIONING", "INITIALIZING", "VALIDATING", "READY", "ACTIVE", "SUSPENDED", "RETIRING", "ARCHIVED"] as const);
const PIPELINE = Object.freeze(["Request", "Identity Allocation", "Namespace Allocation", "Isolation Policy Assignment", "Trust Domain Binding", "Infrastructure Provisioning", "Service Deployment", "Validation", "Registry Registration", "Ready"] as const);
let foundationBaseline: ReturnType<typeof runProvingArchitectureEnvironmentFoundation> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly ProvingProvisioningFailure[], failure: ProvingProvisioningFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: ProvingProvisioningScenario): ProvingProvisioningFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function outcome(failures: readonly ProvingProvisioningFailure[]): ProvingProvisioningOutcome { return has(failures, "GOVERNANCE_REVIEW_REQUIRED") ? "REQUIRES_GOVERNANCE_REVIEW" : failures.length ? "FAIL" : "PASS"; }
function identityRecord(kind: ProvingIdentityKind, environmentId: string, tenantId: string, namespace: string, traceable: boolean): ProvingIdentityRecord {
  return nested({ identity_id: `identity:${kind.toLowerCase()}:${environmentId}`, identity_kind: kind, environment_id: environmentId, tenant_id: tenantId, namespace, lineage_ref: traceable ? `lineage:${kind.toLowerCase()}:${environmentId}` : "", immutable: true, traceable });
}
function invariant(id: string, description: string, satisfied: boolean): ProvingProvisioningInvariant { return nested({ invariant_id: id, description, satisfied, evidence_ref: satisfied ? `evidence:${id.toLowerCase()}` : "" }); }
function resultReplayHash(result: Omit<ProvingProvisioningResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    identity: result.environment_identity.integrity_hash,
    environmentRegistry: result.environment_registry.integrity_hash,
    identityRegistry: result.identity_registry.integrity_hash,
    isolation: result.isolation_policy.integrity_hash,
    provisioning: result.provisioning_pipeline.integrity_hash,
    lifecycle: result.lifecycle.integrity_hash,
    retirement: result.retirement.integrity_hash,
    lineage: result.lineage.integrity_hash,
    invariants: result.invariants.map((item) => item.integrity_hash),
    verification: result.verification.integrity_hash,
    boundaries: result.boundaries.integrity_hash,
    readiness: result.readiness.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<ProvingProvisioningResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.readiness.outcome, replay_hash: result.replay_hash }); }

export function runProvingEnvironmentIdentityIsolationProvisioning(input: ProvingProvisioningInput = {}): ProvingProvisioningResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<ProvingProvisioningFailure>(direct ? [direct] : []);
  foundationBaseline ??= runProvingArchitectureEnvironmentFoundation();
  const dependencyFailures = freezeArray<ProvingProvisioningFailure>(!validateProvingArchitectureEnvironmentFoundation(foundationBaseline).valid || has(scenarioFailures, "P6_1_FOUNDATION_INVALID") ? ["P6_1_FOUNDATION_INVALID"] : []);
  const failures = freezeArray([...new Set([...scenarioFailures, ...dependencyFailures])]);
  const environmentId = input.environment_id ?? "proving-env:civitas:p6.2:identity";
  const tenantId = input.tenant_id ?? "tenant:civitas:proving";
  const namespace = input.namespace ?? "ns:civitas:proving:p6-2";
  const identityValid = !has(failures, "ENVIRONMENT_IDENTITY_MISSING") && !has(failures, "GLOBAL_ID_NOT_UNIQUE") && !has(failures, "IMMUTABLE_IDENTITY_VIOLATION");
  const ownershipValid = !has(failures, "ENVIRONMENT_OWNERSHIP_MISSING");
  const classificationValid = !has(failures, "ENVIRONMENT_CLASSIFICATION_MISSING");
  const tenantValid = !has(failures, "TENANT_ISOLATION_FAILURE") && !has(failures, "MULTI_TENANT_BINDING_DETECTED") && !has(failures, "TENANT_BOUNDARY_CROSSED");
  const namespaceValid = !has(failures, "NAMESPACE_ISOLATION_FAILURE") && !has(failures, "NAMESPACE_NOT_UNIQUE") && !has(failures, "NAMESPACE_MUTATED");
  const registryValid = !has(failures, "ENVIRONMENT_REGISTRY_MISSING") && !has(failures, "ENVIRONMENT_REGISTRY_INCOMPLETE");
  const identityRegistryValid = !has(failures, "IDENTITY_REGISTRY_MISSING") && !has(failures, "IDENTITY_LINEAGE_INCOMPLETE");
  const provisioningValid = !has(failures, "PROVISIONING_PIPELINE_MISSING") && !has(failures, "PROVISIONING_NONDETERMINISTIC") && !has(failures, "TRUST_DOMAIN_BINDING_MISSING") && !has(failures, "POLICY_ATTACHMENT_MISSING") && !has(failures, "SERVICE_DEPLOYMENT_MISSING") && !has(failures, "STORAGE_ALLOCATION_MISSING") && !has(failures, "EVENT_REGISTRATION_MISSING") && !has(failures, "AUDIT_INITIALIZATION_MISSING");
  const lifecycleValid = !has(failures, "LIFECYCLE_MODEL_MISSING") && !has(failures, "LIFECYCLE_TRANSITION_UNGOVERNED") && !has(failures, "LIFECYCLE_AUDIT_EVIDENCE_MISSING");
  const retirementValid = !has(failures, "RETIREMENT_MODEL_MISSING") && !has(failures, "RETIRED_ENVIRONMENT_REACTIVATED") && !has(failures, "IDENTITY_REUSED_AFTER_RETIREMENT") && !has(failures, "EVIDENCE_PRESERVATION_MISSING") && !has(failures, "ARCHIVAL_NOT_IMMUTABLE");
  const lineageValid = !has(failures, "LINEAGE_MISSING") && !has(failures, "LINEAGE_OVERWRITE_DETECTED");
  const replayValid = !has(failures, "REPLAY_IDENTITY_REFERENCE_MUTABLE") && !has(failures, "CONFIGURATION_NOT_REPRODUCIBLE");
  const isolationFailClosed = !has(failures, "ISOLATION_POLICY_VIOLATION_NOT_FAIL_CLOSED");
  const boundariesRespected = !has(failures, "PLATFORM_IDENTITY_OWNERSHIP_VIOLATION") && !has(failures, "DEPLOYMENT_INFRASTRUCTURE_OWNERSHIP_VIOLATION") && !has(failures, "RUNTIME_ORCHESTRATION_OWNERSHIP_VIOLATION") && !has(failures, "PROVING_EXECUTION_OWNERSHIP_VIOLATION") && !has(failures, "VALIDATION_LOGIC_OWNERSHIP_VIOLATION") && !has(failures, "CERTIFICATION_OWNERSHIP_VIOLATION") && !has(failures, "TRUST_DECISION_OWNERSHIP_VIOLATION");
  const environment_identity = nested({ environment_id: identityValid ? environmentId : "", name: "Civitas P6.2 identity isolation proving environment", namespace: namespaceValid ? namespace : "", tenant_id: tenantValid ? tenantId : "", trust_domain: provisioningValid ? "trust-domain:civitas:proving" : "", environment_class: "GOVERNED" as const, environment_type: "VALIDATION" as const, owner: ownershipValid ? "program-6:civitas-proving-ground" : "", creator: "automation:p6.2:provisioning", creation_authority: "authority:constitutional-proving-governance", creation_time: NOW, lifecycle_status: "READY" as const, isolation_policy: tenantValid && namespaceValid ? "policy:p6.2:constitutional-isolation" : "", configuration_version: replayValid ? "config:p6.2.0" : "", parent_environment: foundationBaseline.environment_model.environment_id, replay_compatibility: replayValid, audit_chain: lifecycleValid ? freezeArray(["audit:p6.2:requested", "audit:p6.2:provisioning", "audit:p6.2:ready"]) : freezeArray<string>([]), lineage_id: lineageValid ? "lineage:p6.2:environment" : "", globally_unique: identityValid, immutable: identityValid });
  const environment_registry = nested({ registry_id: registryValid ? "registry:p6.2:environments" : "", environments: registryValid ? freezeArray([environment_identity]) : freezeArray([]), owner_index: registryValid && ownershipValid ? freezeArray([environment_identity.owner]) : freezeArray<string>([]), tenant_index: registryValid && tenantValid ? freezeArray([tenantId]) : freezeArray<string>([]), namespace_index: registryValid && namespaceValid ? freezeArray([namespace]) : freezeArray<string>([]), trust_domain_index: registryValid && provisioningValid ? freezeArray([environment_identity.trust_domain]) : freezeArray<string>([]), lifecycle_index: registryValid ? freezeArray(LIFECYCLE) : freezeArray([]), provisioning_history_refs: registryValid ? freezeArray(["provisioning:p6.2:history"]) : freezeArray<string>([]), retirement_metadata_refs: registryValid && retirementValid ? freezeArray(["retirement:p6.2:metadata"]) : freezeArray<string>([]), immutable_except_lifecycle_progression: registryValid, complete: registryValid && environment_identity.environment_id.length > 0 && environment_identity.tenant_id.length > 0 && environment_identity.namespace.length > 0 && environment_identity.trust_domain.length > 0 });
  const traceable = identityRegistryValid;
  const identity_registry = nested({ registry_id: identityRegistryValid ? "registry:p6.2:identities" : "", environment_identities: identityRegistryValid ? freezeArray([identityRecord("ENVIRONMENT", environmentId, tenantId, namespace, traceable)]) : freezeArray([]), execution_identities: identityRegistryValid ? freezeArray([identityRecord("EXECUTION", environmentId, tenantId, namespace, traceable)]) : freezeArray([]), service_identities: identityRegistryValid ? freezeArray([identityRecord("SERVICE", environmentId, tenantId, namespace, traceable)]) : freezeArray([]), operator_identities: identityRegistryValid ? freezeArray([identityRecord("OPERATOR", environmentId, tenantId, namespace, traceable)]) : freezeArray([]), automation_identities: identityRegistryValid ? freezeArray([identityRecord("AUTOMATION", environmentId, tenantId, namespace, traceable)]) : freezeArray([]), workload_identities: identityRegistryValid ? freezeArray([identityRecord("WORKLOAD", environmentId, tenantId, namespace, traceable)]) : freezeArray([]), complete_lineage: identityRegistryValid });
  const isolation_policy = nested({ policy_id: tenantValid && namespaceValid ? "policy:p6.2:isolation" : "", tenant: tenantValid, namespace: namespaceValid, identity: tenantValid && namespaceValid, storage: tenantValid, network: tenantValid, compute: tenantValid, execution: tenantValid, secrets: tenantValid, configuration: namespaceValid, messaging: tenantValid, telemetry: tenantValid, evidence: tenantValid, audit: tenantValid, replay: tenantValid, policies: namespaceValid, fail_closed: isolationFailClosed, tenant_sharing_prohibited_until_federation: tenantValid });
  const provisioning_pipeline = nested({ pipeline_id: provisioningValid ? "pipeline:p6.2:provisioning" : "", steps: provisioningValid ? PIPELINE : freezeArray<string>([]), identity_assignment: identityValid, namespace_creation: namespaceValid, policy_attachment: !has(failures, "POLICY_ATTACHMENT_MISSING"), trust_domain_binding: !has(failures, "TRUST_DOMAIN_BINDING_MISSING"), infrastructure_provisioning: provisioningValid, service_deployment: !has(failures, "SERVICE_DEPLOYMENT_MISSING"), storage_allocation: !has(failures, "STORAGE_ALLOCATION_MISSING"), event_registration: !has(failures, "EVENT_REGISTRATION_MISSING"), audit_initialization: !has(failures, "AUDIT_INITIALIZATION_MISSING"), deterministic: provisioningValid, repeatable: provisioningValid });
  const lifecycle = nested({ lifecycle_id: lifecycleValid ? "lifecycle:p6.2:environment" : "", states: lifecycleValid ? LIFECYCLE : freezeArray([]), governed_progression: !has(failures, "LIFECYCLE_TRANSITION_UNGOVERNED"), transition_audit_evidence: lifecycleValid ? LIFECYCLE.map((state) => `audit:p6.2:lifecycle:${state.toLowerCase()}`) : freezeArray<string>([]), suspended_recoverable: lifecycleValid, retired_never_reactivated: retirementValid, archived_immutable: retirementValid });
  const retirement = nested({ retirement_id: retirementValid ? "retirement:p6.2:environment" : "", execution_shutdown: retirementValid, evidence_preservation: !has(failures, "EVIDENCE_PRESERVATION_MISSING"), immutable_archival: !has(failures, "ARCHIVAL_NOT_IMMUTABLE"), lineage_completion: lineageValid, identity_retention: retirementValid, identity_reuse_prevented: !has(failures, "IDENTITY_REUSED_AFTER_RETIREMENT"), reactivation_prevented: !has(failures, "RETIRED_ENVIRONMENT_REACTIVATED") });
  const lineage = nested({ lineage_id: lineageValid ? "lineage:p6.2:environment" : "", actor: "automation:p6.2:provisioning", authority: "authority:constitutional-proving-governance", timestamp: NOW, configuration_ref: replayValid ? environment_identity.configuration_version : "", provisioning_source: "p6.1:foundation", parent_environment: foundationBaseline.environment_model.environment_id, cloned_environment: "", lifecycle_transition_refs: lifecycle.transition_audit_evidence, governance_approval_refs: lifecycleValid ? freezeArray(["approval:p6.2:environment-provisioning"]) : freezeArray<string>([]), immutable: lineageValid, overwrite_prevented: !has(failures, "LINEAGE_OVERWRITE_DETECTED"), replay_ref: replayValid ? "replay:p6.2:identity-provisioning" : "" });
  const invariants = freezeArray([
    invariant("P6.2-001", "Every proving environment shall possess a globally unique immutable identity.", identityValid && environment_identity.environment_id.length > 0),
    invariant("P6.2-002", "Every environment shall belong to exactly one tenant.", tenantValid && environment_registry.tenant_index.length === 1),
    invariant("P6.2-003", "An environment shall never cross tenant boundaries.", tenantValid),
    invariant("P6.2-004", "Namespaces shall be globally unique.", namespaceValid && environment_registry.namespace_index.length === 1),
    invariant("P6.2-005", "Environment identity shall never change.", identityValid && environment_identity.immutable),
    invariant("P6.2-006", "Provisioning shall be deterministic.", provisioningValid),
    invariant("P6.2-007", "Every lifecycle transition shall produce immutable audit evidence.", lifecycleValid && lifecycle.transition_audit_evidence.length === LIFECYCLE.length),
    invariant("P6.2-008", "Retired environments shall never be reactivated.", retirement.reactivation_prevented),
    invariant("P6.2-009", "Every environment shall maintain complete lineage from creation through archival.", lineageValid && retirement.lineage_completion),
    invariant("P6.2-010", "Isolation policy violations shall fail closed.", isolationFailClosed),
    invariant("P6.2-011", "Environment configuration shall be fully reproducible.", replayValid),
    invariant("P6.2-012", "Replay shall always reference immutable environment identities.", replayValid && environment_identity.immutable),
  ]);
  const verificationPassed = identityValid && environment_registry.complete && tenantValid && identity_registry.complete_lineage && provisioningValid && lifecycleValid && Object.values(isolation_policy).filter((value) => value === false).length === 0 && retirementValid && lineageValid && replayValid && invariants.every((item) => item.satisfied);
  const verification = nested({ verification_id: "P6.2-VERIFY-001" as const, globally_unique_immutable_identity: identityValid, registry_complete: environment_registry.complete, exact_single_tenant_binding: tenantValid && environment_registry.tenant_index.length === 1, identity_lineage_complete: identity_registry.complete_lineage, deterministic_repeatable_provisioning: provisioning_pipeline.deterministic && provisioning_pipeline.repeatable, lifecycle_governed_auditable: lifecycle.governed_progression && lifecycle.transition_audit_evidence.length === LIFECYCLE.length, isolation_enforced: isolation_policy.tenant && isolation_policy.namespace && isolation_policy.evidence && isolation_policy.replay && isolation_policy.fail_closed, retirement_preserves_lineage: retirement.evidence_preservation && retirement.immutable_archival && retirement.lineage_completion && retirement.identity_reuse_prevented && retirement.reactivation_prevented, replay_reproducible_with_immutable_identity: replayValid && environment_identity.immutable, invariants_satisfied: invariants.every((item) => item.satisfied), passed: verificationPassed });
  const boundaries = nested({ boundary_id: "boundaries:p6.2", owns_proving_execution: false as const, owns_simulations: false as const, owns_validation_logic: false as const, owns_certification: false as const, owns_trust_decisions: false as const, owns_deployment_infrastructure: false as const, owns_platform_identity: false as const, owns_runtime_orchestration: false as const });
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(!verification.passed ? ["P6_2_VERIFY_001_FAILED" as const] : []),
    ...(!identityValid ? ["ENVIRONMENT_IDENTITY_MISSING" as const] : []),
    ...(!environment_registry.complete ? ["ENVIRONMENT_REGISTRY_INCOMPLETE" as const] : []),
    ...(!identity_registry.complete_lineage ? ["IDENTITY_LINEAGE_INCOMPLETE" as const] : []),
    ...(!tenantValid ? ["TENANT_ISOLATION_FAILURE" as const] : []),
    ...(!namespaceValid ? ["NAMESPACE_ISOLATION_FAILURE" as const] : []),
    ...(!provisioningValid ? ["PROVISIONING_PIPELINE_MISSING" as const] : []),
    ...(!lifecycleValid ? ["LIFECYCLE_MODEL_MISSING" as const] : []),
    ...(!retirementValid ? ["RETIREMENT_MODEL_MISSING" as const] : []),
    ...(!lineageValid ? ["LINEAGE_MISSING" as const] : []),
    ...(!boundariesRespected ? [has(failures, "PLATFORM_IDENTITY_OWNERSHIP_VIOLATION") ? "PLATFORM_IDENTITY_OWNERSHIP_VIOLATION" as const : "PROVING_EXECUTION_OWNERSHIP_VIOLATION" as const] : []),
  ])]);
  const readiness = nested({ readiness_id: "P6.2-IDENTITY-ISOLATION-PROVISIONING-READINESS-001", outcome: outcome(derivedFailures), phase_ready: outcome(derivedFailures) === "PASS", identity_ready: identityValid && ownershipValid && classificationValid, environment_registry_ready: environment_registry.complete, identity_registry_ready: identity_registry.complete_lineage, tenant_isolation_ready: tenantValid, namespace_isolation_ready: namespaceValid, provisioning_ready: provisioningValid, lifecycle_ready: lifecycleValid, retirement_ready: retirementValid, lineage_ready: lineageValid, verification_ready: verification.passed, boundaries_respected: boundariesRespected, failures: derivedFailures });
  const base: Omit<ProvingProvisioningResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, foundation_ref: "proving-architecture-environment-foundation/v6.1", environment_identity, environment_registry, identity_registry, isolation_policy, provisioning_pipeline, lifecycle, retirement, lineage, invariants, verification, boundaries, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateProvingEnvironmentIdentityIsolationProvisioning(result?: ProvingProvisioningResult): ProvingProvisioningValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, identity_valid: false, environment_registry_valid: false, identity_registry_valid: false, isolation_valid: false, provisioning_valid: false, lifecycle_valid: false, retirement_valid: false, lineage_valid: false, invariants_valid: false, verification_valid: false, boundaries_valid: false, readiness_valid: false, failures: freezeArray(["ENVIRONMENT_IDENTITY_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const identity_valid = verifyHashed(result.environment_identity) && result.environment_identity.environment_id.length > 0 && result.environment_identity.globally_unique && result.environment_identity.immutable && result.environment_identity.tenant_id.length > 0 && result.environment_identity.namespace.length > 0;
  const environment_registry_valid = verifyHashed(result.environment_registry) && result.environment_registry.complete && result.environment_registry.environments.length === 1 && result.environment_registry.immutable_except_lifecycle_progression;
  const identity_registry_valid = verifyHashed(result.identity_registry) && result.identity_registry.complete_lineage && result.identity_registry.environment_identities.length === 1 && result.identity_registry.execution_identities.length === 1 && result.identity_registry.workload_identities.length === 1;
  const isolation_valid = verifyHashed(result.isolation_policy) && result.isolation_policy.tenant && result.isolation_policy.namespace && result.isolation_policy.storage && result.isolation_policy.network && result.isolation_policy.evidence && result.isolation_policy.replay && result.isolation_policy.fail_closed;
  const provisioning_valid = verifyHashed(result.provisioning_pipeline) && result.provisioning_pipeline.steps.length === PIPELINE.length && result.provisioning_pipeline.deterministic && result.provisioning_pipeline.repeatable && result.provisioning_pipeline.trust_domain_binding;
  const lifecycle_valid = verifyHashed(result.lifecycle) && result.lifecycle.states.length === LIFECYCLE.length && result.lifecycle.governed_progression && result.lifecycle.transition_audit_evidence.length === LIFECYCLE.length;
  const retirement_valid = verifyHashed(result.retirement) && result.retirement.evidence_preservation && result.retirement.immutable_archival && result.retirement.identity_reuse_prevented && result.retirement.reactivation_prevented;
  const lineage_valid = verifyHashed(result.lineage) && result.lineage.lineage_id.length > 0 && result.lineage.immutable && result.lineage.overwrite_prevented && result.lineage.replay_ref.length > 0;
  const invariants_valid = result.invariants.length === 12 && result.invariants.every((item) => verifyHashed(item) && item.satisfied);
  const verification_valid = verifyHashed(result.verification) && result.verification.verification_id === "P6.2-VERIFY-001" && result.verification.passed;
  const boundaries_valid = verifyHashed(result.boundaries) && !result.boundaries.owns_proving_execution && !result.boundaries.owns_validation_logic && !result.boundaries.owns_certification && !result.boundaries.owns_trust_decisions && !result.boundaries.owns_platform_identity;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.outcome === "PASS" && result.readiness.phase_ready && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && identity_valid && environment_registry_valid && identity_registry_valid && isolation_valid && provisioning_valid && lifecycle_valid && retirement_valid && lineage_valid && invariants_valid && verification_valid && boundaries_valid && readiness_valid;
  return nested({ valid, outcome: result.readiness.outcome, replay_hash_valid, integrity_hash_valid, identity_valid, environment_registry_valid, identity_registry_valid, isolation_valid, provisioning_valid, lifecycle_valid, retirement_valid, lineage_valid, invariants_valid, verification_valid, boundaries_valid, readiness_valid, failures: result.readiness.failures });
}

export function replayProvingEnvironmentIdentityIsolationProvisioning(result = runProvingEnvironmentIdentityIsolationProvisioning()): boolean {
  const replayed = runProvingEnvironmentIdentityIsolationProvisioning();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateProvingEnvironmentIdentityIsolationProvisioning(result).valid;
}

export function getProvingEnvironmentIdentityIsolationProvisioningBundle(): ProvingProvisioningBundle {
  const result = runProvingEnvironmentIdentityIsolationProvisioning();
  return Object.freeze({
    doctrine: Object.freeze({ version: VERSION, owns_proving_identities: true, owns_environment_identities: true, owns_tenant_isolation: true, owns_environment_lifecycle: true, owns_environment_registry: true, owns_proving_execution: false, owns_validation_logic: false, owns_certification: false, owns_trust_decisions: false, owns_deployment_infrastructure: false, owns_platform_identity: false, owns_runtime_orchestration: false }),
    result,
    validation: validateProvingEnvironmentIdentityIsolationProvisioning(result),
  });
}

export const ProvingEnvironmentIdentityIsolationProvisioningService = Object.freeze({ run: runProvingEnvironmentIdentityIsolationProvisioning, validate: validateProvingEnvironmentIdentityIsolationProvisioning, replay: replayProvingEnvironmentIdentityIsolationProvisioning });
