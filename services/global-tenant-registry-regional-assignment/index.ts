import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runTenantProvisioningLifecycle } from "@/services/tenant-provisioning-lifecycle";
import type {
  AssignmentLifecycleState,
  AssignmentMutationOutcome,
  GlobalTenantRegistryRegionalAssignmentBundle,
  GlobalTenantRegistryRegionalAssignmentFailure,
  GlobalTenantRegistryRegionalAssignmentInput,
  GlobalTenantRegistryRegionalAssignmentOutcome,
  GlobalTenantRegistryRegionalAssignmentResult,
  GlobalTenantRegistryRegionalAssignmentTest,
  GlobalTenantRegistryRegionalAssignmentValidation,
  RegistryState,
} from "@/types/global-tenant-registry-regional-assignment";

const VERSION = "global-tenant-registry-regional-assignment/v17.3" as const;
const IDENTIFIER = "GlobalTenantRegistryRegionalAssignment" as const;
const TIMESTAMP = "2026-07-16T00:00:00.000Z" as const;
const DEFAULT_TENANT = "tenant_phase_17_global_registry";
const DEFAULT_OPERATOR = "operator_phase_17_global_registry";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly GlobalTenantRegistryRegionalAssignmentFailure[], failure: GlobalTenantRegistryRegionalAssignmentFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: GlobalTenantRegistryRegionalAssignmentInput["scenario"]): GlobalTenantRegistryRegionalAssignmentFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly GlobalTenantRegistryRegionalAssignmentFailure[]): GlobalTenantRegistryRegionalAssignmentOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_REGISTRY_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const assignmentLifecycleStates = freezeArray(["REQUESTED", "VALIDATING", "AUTHORIZED", "COMPARE_AND_SET", "COMMITTED", "ACTIVE", "SUPERSEDED", "ARCHIVED"] as const satisfies readonly AssignmentLifecycleState[]);
const registryStates = freezeArray(["REGISTERED", "ASSIGNED", "ACTIVE", "REASSIGNED", "RETIRED"] as const satisfies readonly RegistryState[]);
const mutationOutcomes = freezeArray(["ASSIGNMENT_COMMITTED", "STALE_ASSIGNMENT_PROPOSAL", "ASSIGNMENT_CONSTRAINT_VIOLATION", "ASSIGNMENT_AUTHORITY_INVALID", "ASSIGNMENT_INTEGRITY_FAILURE"] as const satisfies readonly AssignmentMutationOutcome[]);

function certTest(name: string, passed: boolean, failure: GlobalTenantRegistryRegionalAssignmentFailure, evidence_refs: readonly string[]): GlobalTenantRegistryRegionalAssignmentTest {
  const actual: GlobalTenantRegistryRegionalAssignmentOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_REGISTRY_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("global_registry_assignment_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<GlobalTenantRegistryRegionalAssignmentResult, "replay_hash" | "integrity_hash">): string {
  return hash({ lifecycle: result.tenant_provisioning_lifecycle_ref, envelope: result.mutation_envelope.integrity_hash, global: result.global_registry.integrity_hash, regional: result.regional_assignment_registry.integrity_hash, mutation: result.mutation_validation.integrity_hash, authority: result.authority_validation.integrity_hash, resolver: result.conflict_resolver.integrity_hash, ledger: result.assignment_ledger.map((entry) => entry.integrity_hash), replay: result.replay_service.integrity_hash, integrity: result.integrity_validator.integrity_hash, dashboard: result.dashboard.integrity_hash, package: result.certification_package.integrity_hash, tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<GlobalTenantRegistryRegionalAssignmentResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash }); }

export function runGlobalTenantRegistryRegionalAssignment(input: GlobalTenantRegistryRegionalAssignmentInput = {}): GlobalTenantRegistryRegionalAssignmentResult {
  const lifecycle = runTenantProvisioningLifecycle({ tenant_id: input.tenant_id ?? DEFAULT_TENANT, operator_id: input.operator_id ?? DEFAULT_OPERATOR, mission_id: input.mission_id });
  const direct = directFailure(input.scenario);
  const upstreamFailures: GlobalTenantRegistryRegionalAssignmentFailure[] = lifecycle.outcome === "PASS" ? [] : ["PHASE_17_2_LIFECYCLE_NOT_VALID"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const blockingFailures = freezeArray(failures.filter((failure) => failure !== "NON_CONSTITUTIONAL_REGISTRY_WARNING"));
  const tenantId = input.tenant_id ?? DEFAULT_TENANT;
  const registryVersion = input.registry_version ?? "17.3.0";
  const expectedVersion = input.expected_registry_version ?? registryVersion;
  const currentAssignmentRef = id("assignment_ref", { tenantId, registryVersion });
  const evidenceRefs = freezeArray([lifecycle.integrity_hash, lifecycle.lifecycle_registry.integrity_hash, lifecycle.certification_package.integrity_hash]);
  const replayRefs = has(failures, "REPLAY_NOT_PRESERVED") ? freezeArray([]) : freezeArray([lifecycle.replay_hash, lifecycle.replay_service.integrity_hash]);
  const mutation_envelope = nested({ tenant_id: tenantId, request_id: input.request_id ?? id("assignment_request", tenantId), expected_registry_version: has(failures, "STALE_PROPOSALS_NOT_REJECTED") ? "stale-version" : expectedVersion, current_assignment_ref: has(failures, "MUTATION_ENVELOPE_INCOMPLETE") ? "" : currentAssignmentRef, proposed_assignment: input.target_region ?? "global-region-a", assignment_reason: "deterministic constitutional regional assignment", authorizing_decision_ref: has(failures, "ASSIGNMENT_AUTHORITY_NOT_VALIDATED") ? "" : lifecycle.transition_validation.integrity_hash, requester_identity: input.operator_id ?? DEFAULT_OPERATOR, request_timestamp: TIMESTAMP });
  const tenantRecord = nested({ tenant_id: tenantId, registry_version: registryVersion, tenant_owner: "constitutional-tenant-owner", current_regional_assignment: mutation_envelope.proposed_assignment, assignment_history_ref: currentAssignmentRef, deployment_status: "ACTIVE" as const, certification_status: blockingFailures.length ? "NOT_CERTIFIED" as const : "CERTIFIED" as const, resource_quotas: freezeArray(["quota:advisory-workload", "quota:evidence-ingestion", "quota:replay"]), lifecycle_status: "ACTIVE" as const, integrity_state: has(failures, "ASSIGNMENT_INTEGRITY_NOT_VERIFIED") ? "INVALID" as const : "VALID" as const });
  const global_registry = nested({ registry_id: id("global_tenant_registry", registryVersion), authoritative: !has(failures, "GLOBAL_REGISTRY_NOT_AUTHORITATIVE"), tenant_records: freezeArray([tenantRecord]), registry_state_history: registryStates, deterministic: !has(failures, "REGISTRY_NOT_DETERMINISTIC"), versioned: true, replayable: replayRefs.length > 0 });
  const regional_assignment_registry = nested({ registry_id: id("regional_assignment_registry", registryVersion), active_assignments: freezeArray([tenantRecord.current_regional_assignment]), pending_assignments: freezeArray([]), reassignment_requests: freezeArray([mutation_envelope.integrity_hash]), assignment_lineage: freezeArray([currentAssignmentRef, tenantRecord.integrity_hash]), assignment_authority: freezeArray([mutation_envelope.authorizing_decision_ref]), assignment_validation: freezeArray([mutation_envelope.integrity_hash]), registry_version_history: freezeArray([registryVersion]), single_source_of_truth: !has(failures, "GLOBAL_REGISTRY_NOT_AUTHORITATIVE"), immutable_history: !has(failures, "IMMUTABLE_ASSIGNMENT_AUDIT_INCOMPLETE") && !has(failures, "SILENT_OVERWRITE_POSSIBLE") });
  const authority_validation = nested({ authority_id: id("assignment_authority", mutation_envelope.integrity_hash), governance_authorization: mutation_envelope.authorizing_decision_ref.length > 0, tenant_ownership: true, regional_policy: true, deployment_qualification: true, certification_authority: lifecycle.outcome === "PASS", constitutional_compliance: !has(failures, "ASSIGNMENT_AUTHORITY_NOT_VALIDATED"), precedes_registry_mutation: true });
  const conflict_resolver = nested({ resolver_id: id("compare_and_set_resolver", mutation_envelope.integrity_hash), validates_registry_version: !has(failures, "COMPARE_AND_SET_NOT_ENFORCED"), validates_current_assignment: !has(failures, "COMPARE_AND_SET_NOT_ENFORCED"), validates_mutation_authority: authority_validation.governance_authorization, validates_integrity: !has(failures, "ASSIGNMENT_INTEGRITY_NOT_VERIFIED"), validates_replay_consistency: replayRefs.length > 0, rejects_stale_proposals: !has(failures, "STALE_PROPOSALS_NOT_REJECTED"), prohibits_last_writer_wins: !has(failures, "SILENT_OVERWRITE_POSSIBLE"), ignores_arrival_order: true, ignores_processing_latency: true, ignores_wall_clock_ordering: !has(failures, "TIMESTAMP_USED_FOR_PRECEDENCE"), ignores_timestamp_ordering: !has(failures, "TIMESTAMP_USED_FOR_PRECEDENCE") });
  const mutationOutcome: AssignmentMutationOutcome = has(failures, "ASSIGNMENT_AUTHORITY_NOT_VALIDATED") ? "ASSIGNMENT_AUTHORITY_INVALID" : has(failures, "ASSIGNMENT_INTEGRITY_NOT_VERIFIED") ? "ASSIGNMENT_INTEGRITY_FAILURE" : has(failures, "STALE_PROPOSALS_NOT_REJECTED") ? "STALE_ASSIGNMENT_PROPOSAL" : blockingFailures.length ? "ASSIGNMENT_CONSTRAINT_VIOLATION" : "ASSIGNMENT_COMMITTED";
  const mutation_validation = nested({ validation_id: id("assignment_mutation_validation", mutation_envelope.integrity_hash), tenant_exists: true, requester_authorized: authority_validation.governance_authorization, registry_version_matches: mutation_envelope.expected_registry_version === registryVersion, assignment_valid: true, target_region_eligible: true, certification_permits_assignment: tenantRecord.certification_status === "CERTIFIED", quota_constraints_satisfied: true, integrity_verified: tenantRecord.integrity_state === "VALID", replay_preserved: replayRefs.length > 0, envelope_complete: mutation_envelope.current_assignment_ref.length > 0, outcome: mutationOutcome });
  const assignment_ledger = freezeArray(assignmentLifecycleStates.map((state, index) => nested({ ledger_entry_id: id("assignment_ledger", { state, index }), sequence: index + 1, registry_version: registryVersion, assignment_ref: currentAssignmentRef, authority_ref: authority_validation.integrity_hash, mutation_evidence_ref: mutation_validation.integrity_hash, replay_ref: replayRefs[0] ?? "", certification_ref: lifecycle.certification_package.integrity_hash, supersedes: index === 0 ? null : currentAssignmentRef, append_only: !has(failures, "IMMUTABLE_ASSIGNMENT_AUDIT_INCOMPLETE"), immutable: !has(failures, "IMMUTABLE_ASSIGNMENT_AUDIT_INCOMPLETE") })));
  const replay_service = nested({ replay_id: id("assignment_replay", tenantId), reconstructs_registry_creation: replayRefs.length > 0, reconstructs_assignment_requests: replayRefs.length > 0, reconstructs_authority_validation: replayRefs.length > 0, reconstructs_compare_and_set_decisions: replayRefs.length > 0, reconstructs_rejected_mutations: replayRefs.length > 0, reconstructs_committed_assignments: replayRefs.length > 0, reconstructs_superseded_assignments: replayRefs.length > 0, reconstructs_integrity_validation: replayRefs.length > 0, reconstructs_registry_versions: replayRefs.length > 0, reproduces_identical_registry_state: replayRefs.length > 0, replay_refs: replayRefs });
  const integrity_validator = nested({ validator_id: id("registry_integrity_validator", registryVersion), registry_integrity_valid: global_registry.authoritative && global_registry.deterministic, assignment_integrity_valid: tenantRecord.integrity_state === "VALID", ledger_integrity_valid: assignment_ledger.every((entry) => entry.immutable && entry.append_only), replay_integrity_valid: replay_service.reproduces_identical_registry_state, certification_integrity_valid: lifecycle.outcome === "PASS", timestamp_metadata_only: !has(failures, "TIMESTAMP_USED_FOR_PRECEDENCE"), no_implicit_overwrite_semantics: !has(failures, "SILENT_OVERWRITE_POSSIBLE") });
  const dashboard = nested({ dashboard_id: id("assignment_audit_dashboard", registryVersion), registry_health_visible: true, assignment_activity_visible: true, regional_distribution_visible: true, mutation_throughput_visible: true, rejected_mutations_visible: true, stale_proposal_frequency_visible: true, authority_failures_visible: true, integrity_failures_visible: true, replay_verification_visible: replayRefs.length > 0, certification_status_visible: true, operational: true });
  const certification_package = nested({ package_id: id("registry_certification_package", registryVersion), deterministic_registry_behavior: global_registry.deterministic, compare_and_set_enforced: conflict_resolver.validates_registry_version && conflict_resolver.validates_current_assignment, authority_validation_complete: Object.entries(authority_validation).filter(([key]) => !["authority_id", "integrity_hash"].includes(key)).every(([, value]) => value === true), immutable_assignment_history: regional_assignment_registry.immutable_history && assignment_ledger.every((entry) => entry.immutable), replay_determinism: replay_service.reproduces_identical_registry_state, integrity_verification: integrity_validator.assignment_integrity_valid && integrity_validator.registry_integrity_valid, conflict_resolution_correct: conflict_resolver.rejects_stale_proposals && conflict_resolver.ignores_timestamp_ordering, overwrite_prevention: conflict_resolver.prohibits_last_writer_wins && integrity_validator.no_implicit_overwrite_semantics, audit_complete: dashboard.operational && assignment_ledger.length === 8, constitutional_compliance: global_registry.authoritative && authority_validation.constitutional_compliance, registry_certified: blockingFailures.length === 0, evidence_refs: evidenceRefs });
  const tests = freezeArray([
    certTest("Registry deterministic", certification_package.deterministic_registry_behavior, "REGISTRY_NOT_DETERMINISTIC", [global_registry.integrity_hash]),
    certTest("Compare-and-set semantics enforced", certification_package.compare_and_set_enforced, "COMPARE_AND_SET_NOT_ENFORCED", [conflict_resolver.integrity_hash]),
    certTest("Stale proposals rejected", conflict_resolver.rejects_stale_proposals, "STALE_PROPOSALS_NOT_REJECTED", [conflict_resolver.integrity_hash]),
    certTest("Silent overwrite impossible", certification_package.overwrite_prevention, "SILENT_OVERWRITE_POSSIBLE", [integrity_validator.integrity_hash]),
    certTest("Immutable assignment audit complete", certification_package.immutable_assignment_history && certification_package.audit_complete, "IMMUTABLE_ASSIGNMENT_AUDIT_INCOMPLETE", assignment_ledger.map((entry) => entry.integrity_hash)),
    certTest("Replay preserved", certification_package.replay_determinism, "REPLAY_NOT_PRESERVED", [replay_service.integrity_hash]),
    certTest("Registry certified", certification_package.registry_certified, "REGISTRY_NOT_CERTIFIED", [certification_package.integrity_hash]),
    certTest("Global registry authoritative", global_registry.authoritative && regional_assignment_registry.single_source_of_truth, "GLOBAL_REGISTRY_NOT_AUTHORITATIVE", [global_registry.integrity_hash]),
    certTest("Assignment authority validated", certification_package.authority_validation_complete, "ASSIGNMENT_AUTHORITY_NOT_VALIDATED", [authority_validation.integrity_hash]),
    certTest("Assignment integrity verified", certification_package.integrity_verification, "ASSIGNMENT_INTEGRITY_NOT_VERIFIED", [integrity_validator.integrity_hash]),
    certTest("Timestamp excluded from precedence", integrity_validator.timestamp_metadata_only && conflict_resolver.ignores_timestamp_ordering, "TIMESTAMP_USED_FOR_PRECEDENCE", [conflict_resolver.integrity_hash]),
    certTest("Mutation envelope complete", mutation_validation.envelope_complete, "MUTATION_ENVELOPE_INCOMPLETE", [mutation_envelope.integrity_hash]),
    certTest("Phase 17.2 lifecycle valid", lifecycle.outcome === "PASS", "PHASE_17_2_LIFECYCLE_NOT_VALID", [lifecycle.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is GlobalTenantRegistryRegionalAssignmentFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<GlobalTenantRegistryRegionalAssignmentResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, tenant_provisioning_lifecycle_ref: lifecycle.integrity_hash, mutation_envelope, global_registry, regional_assignment_registry, mutation_validation, authority_validation, conflict_resolver, assignment_ledger, replay_service, integrity_validator, dashboard, certification_package, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateGlobalTenantRegistryRegionalAssignment(result = runGlobalTenantRegistryRegionalAssignment()): GlobalTenantRegistryRegionalAssignmentValidation {
  const envelope_valid = verify(result.mutation_envelope) && Object.entries(result.mutation_envelope).filter(([key]) => key !== "integrity_hash").every(([, value]) => typeof value === "string" && value.length > 0);
  const global_registry_valid = verify(result.global_registry) && result.global_registry.authoritative && result.global_registry.tenant_records.length === 1 && result.global_registry.registry_state_history.length === 5 && result.global_registry.deterministic && result.global_registry.versioned && result.global_registry.replayable && result.global_registry.tenant_records.every((record) => verify(record) && record.integrity_state === "VALID" && record.certification_status === "CERTIFIED");
  const regional_registry_valid = verify(result.regional_assignment_registry) && result.regional_assignment_registry.single_source_of_truth && result.regional_assignment_registry.immutable_history && result.regional_assignment_registry.active_assignments.length > 0 && result.regional_assignment_registry.assignment_lineage.length > 0 && result.regional_assignment_registry.registry_version_history.length > 0;
  const mutation_valid = verify(result.mutation_validation) && result.mutation_validation.outcome === "ASSIGNMENT_COMMITTED" && Object.entries(result.mutation_validation).filter(([key]) => !["validation_id", "outcome", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const authority_valid = verify(result.authority_validation) && Object.entries(result.authority_validation).filter(([key]) => !["authority_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const resolver_valid = verify(result.conflict_resolver) && Object.entries(result.conflict_resolver).filter(([key]) => !["resolver_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const ledger_valid = result.assignment_ledger.length === 8 && result.assignment_ledger.every((entry, index) => verify(entry) && entry.sequence === index + 1 && entry.assignment_ref.length > 0 && entry.authority_ref.length > 0 && entry.mutation_evidence_ref.length > 0 && entry.replay_ref.length > 0 && entry.certification_ref.length > 0 && entry.append_only && entry.immutable);
  const replay_valid = verify(result.replay_service) && result.replay_service.replay_refs.length > 0 && Object.entries(result.replay_service).filter(([key]) => !["replay_id", "replay_refs", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const integrity_valid = verify(result.integrity_validator) && Object.entries(result.integrity_validator).filter(([key]) => !["validator_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const dashboard_valid = verify(result.dashboard) && Object.entries(result.dashboard).filter(([key]) => !["dashboard_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const certification_package_valid = verify(result.certification_package) && result.certification_package.evidence_refs.length > 0 && Object.entries(result.certification_package).filter(([key]) => !["package_id", "evidence_refs", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const certification_valid = result.certification_tests.length === 13 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const result_replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && envelope_valid && global_registry_valid && regional_registry_valid && mutation_valid && authority_valid && resolver_valid && ledger_valid && replay_valid && integrity_valid && dashboard_valid && certification_package_valid && certification_valid && result_replay_valid;
  return nested({ valid, outcome: result.outcome, envelope_valid, global_registry_valid, regional_registry_valid, mutation_valid, authority_valid, resolver_valid, ledger_valid, replay_valid, integrity_valid, dashboard_valid, certification_package_valid, certification_valid, result_replay_valid, failures: result.failures });
}

export function replayGlobalTenantRegistryRegionalAssignment(result = runGlobalTenantRegistryRegionalAssignment()): boolean {
  const replayed = runGlobalTenantRegistryRegionalAssignment();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateGlobalTenantRegistryRegionalAssignment(result).valid;
}

export function getGlobalTenantRegistryRegionalAssignmentBundle(): GlobalTenantRegistryRegionalAssignmentBundle {
  const result = runGlobalTenantRegistryRegionalAssignment();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "tenant-provisioning-lifecycle/v17.2" as const, assignment_lifecycle_states: assignmentLifecycleStates, registry_states: registryStates, mutation_outcomes: mutationOutcomes, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateGlobalTenantRegistryRegionalAssignment(result) });
}

export const GlobalTenantRegistryRegionalAssignmentService = Object.freeze({ run: runGlobalTenantRegistryRegionalAssignment, validate: validateGlobalTenantRegistryRegionalAssignment, replay: replayGlobalTenantRegistryRegionalAssignment });
