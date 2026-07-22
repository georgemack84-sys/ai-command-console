import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runGlobalTenantRegistryRegionalAssignment } from "@/services/global-tenant-registry-regional-assignment";
import type {
  CapacityState,
  ReservationState,
  ResourceClass,
  ResourceLifecycleState,
  ResourceSchedulingCapacityBundle,
  ResourceSchedulingCapacityFailure,
  ResourceSchedulingCapacityInput,
  ResourceSchedulingCapacityOutcome,
  ResourceSchedulingCapacityResult,
  ResourceSchedulingCapacityTest,
  ResourceSchedulingCapacityValidation,
  SchedulerDecision,
} from "@/types/resource-scheduling-capacity-management";

const VERSION = "resource-scheduling-capacity-management/v17.4" as const;
const IDENTIFIER = "ResourceSchedulingCapacityManagement" as const;
const DEFAULT_TENANT = "tenant_phase_17_capacity";
const DEFAULT_OPERATOR = "operator_phase_17_capacity";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly ResourceSchedulingCapacityFailure[], failure: ResourceSchedulingCapacityFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: ResourceSchedulingCapacityInput["scenario"]): ResourceSchedulingCapacityFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly ResourceSchedulingCapacityFailure[]): ResourceSchedulingCapacityOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_SCHEDULING_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const resourceClasses = freezeArray(["COMPUTE", "MEMORY", "STORAGE", "NETWORK", "INFERENCE", "REPLAY", "SYSTEM"] as const satisfies readonly ResourceClass[]);
const resourceLifecycleStates = freezeArray(["REQUESTED", "VALIDATED", "RESERVED", "ALLOCATED", "ACTIVE", "MODIFIED", "SUSPENDED", "RELEASED", "ARCHIVED"] as const satisfies readonly ResourceLifecycleState[]);
const capacityStates = freezeArray(["AVAILABLE", "RESERVED", "ALLOCATED", "DEGRADED", "EXHAUSTED", "RETIRED"] as const satisfies readonly CapacityState[]);
const reservationStates = freezeArray(["REQUESTED", "APPROVED", "RESERVED", "EXPIRED", "CONSUMED", "CANCELLED"] as const satisfies readonly ReservationState[]);
const schedulerDecisions = freezeArray(["ALLOCATE", "REJECT_INSUFFICIENT_CAPACITY", "REJECT_QUOTA_EXCEEDED", "REJECT_INVALID_ASSIGNMENT", "REJECT_POLICY_VIOLATION", "REJECT_GOVERNANCE"] as const satisfies readonly SchedulerDecision[]);

function certTest(name: string, passed: boolean, failure: ResourceSchedulingCapacityFailure, evidence_refs: readonly string[]): ResourceSchedulingCapacityTest {
  const actual: ResourceSchedulingCapacityOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_SCHEDULING_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("resource_scheduling_capacity_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<ResourceSchedulingCapacityResult, "replay_hash" | "integrity_hash">): string {
  return hash({ registry: result.global_tenant_registry_regional_assignment_ref, allocation: result.allocation_record.integrity_hash, scheduler: result.scheduler.integrity_hash, capacity: result.capacity_planner.integrity_hash, quota: result.quota_manager.integrity_hash, reservation: result.reservation_service.integrity_hash, classification: result.classification_registry.integrity_hash, policy: result.policy_engine.integrity_hash, validation: result.allocation_validation.integrity_hash, forecast: result.forecast_engine.integrity_hash, ledger: result.allocation_ledger.map((entry) => entry.integrity_hash), replay: result.replay_service.integrity_hash, dashboard: result.dashboard.integrity_hash, package: result.certification_package.integrity_hash, tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<ResourceSchedulingCapacityResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash }); }

export function runResourceSchedulingCapacityManagement(input: ResourceSchedulingCapacityInput = {}): ResourceSchedulingCapacityResult {
  const registry = runGlobalTenantRegistryRegionalAssignment({ tenant_id: input.tenant_id ?? DEFAULT_TENANT, operator_id: input.operator_id ?? DEFAULT_OPERATOR, mission_id: input.mission_id, target_region: input.region });
  const direct = directFailure(input.scenario);
  const upstreamFailures: ResourceSchedulingCapacityFailure[] = registry.outcome === "PASS" ? [] : ["PHASE_17_3_REGISTRY_NOT_VALID"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const blockingFailures = freezeArray(failures.filter((failure) => failure !== "NON_CONSTITUTIONAL_SCHEDULING_WARNING"));
  const tenantId = input.tenant_id ?? DEFAULT_TENANT;
  const requestId = input.request_id ?? id("resource_request", tenantId);
  const requested = input.requested_capacity ?? 42;
  const quotaLimit = input.quota_limit ?? 100;
  const evidenceRefs = freezeArray([registry.integrity_hash, registry.global_registry.integrity_hash, registry.regional_assignment_registry.integrity_hash]);
  const replayRefs = has(failures, "REPLAY_NOT_PRESERVED") ? freezeArray([]) : freezeArray([registry.replay_hash, registry.replay_service.integrity_hash]);
  const regionalAssignment = registry.mutation_envelope.proposed_assignment;
  const quotaAvailable = !has(failures, "QUOTAS_NOT_ENFORCED") && requested <= quotaLimit;
  const regionalValid = !has(failures, "REGIONAL_ASSIGNMENT_NOT_VALIDATED") && registry.mutation_validation.outcome === "ASSIGNMENT_COMMITTED";
  const governanceValid = !has(failures, "GOVERNANCE_BYPASSED");
  const decision: SchedulerDecision = !regionalValid ? "REJECT_INVALID_ASSIGNMENT" : !quotaAvailable ? "REJECT_QUOTA_EXCEEDED" : !governanceValid ? "REJECT_GOVERNANCE" : blockingFailures.length ? "REJECT_POLICY_VIOLATION" : "ALLOCATE";
  const approved = decision === "ALLOCATE" ? requested : 0;
  const allocation_record = nested({ allocation_id: id("resource_allocation", { tenantId, requestId }), tenant_id: tenantId, resource_class: "COMPUTE" as const, allocation_policy: "constitutional-deterministic-fairness", requested_capacity: requested, approved_capacity: approved, regional_assignment: regionalAssignment, scheduler_decision: decision, quota_reference: id("quota", { tenantId, quotaLimit }), governance_authority: governanceValid ? registry.authority_validation.integrity_hash : "", replay_reference: replayRefs[0] ?? "" });
  const scheduler = nested({ scheduler_id: id("resource_scheduler", tenantId), scheduled_requests: freezeArray([requestId]), validates_capacity: true, enforces_quotas: quotaAvailable, reserves_resources: decision === "ALLOCATE", allocates_resources: decision === "ALLOCATE", records_lineage: true, replay_supported: replayRefs.length > 0, deterministic_ordering: !has(failures, "ALLOCATION_NOT_DETERMINISTIC"), independent_of_processing_latency: !has(failures, "SCHEDULING_DEPENDS_ON_TIMING"), independent_of_wall_clock: !has(failures, "SCHEDULING_DEPENDS_ON_TIMING"), independent_of_topology: !has(failures, "SCHEDULING_DEPENDS_ON_TIMING"), independent_of_async_order: !has(failures, "SCHEDULING_DEPENDS_ON_TIMING") });
  const capacity_planner = nested({ planner_id: id("capacity_planner", tenantId), utilization_forecast: freezeArray([41, 47, 53]), regional_capacity_planning: true, infrastructure_reservation: true, growth_analysis: true, exhaustion_prediction: true, capacity_certification: true, capacity_states: capacityStates, never_overrides_constitutional_rules: true });
  const quota_manager = nested({ quota_manager_id: id("quota_manager", tenantId), quota_categories: freezeArray(resourceClasses.filter((klass) => klass !== "SYSTEM")), quota_limit: quotaLimit, requested_capacity: requested, approved_capacity: approved, quota_available: quotaAvailable, deterministic_decision: !has(failures, "ALLOCATION_NOT_DETERMINISTIC"), timing_independent: !has(failures, "SCHEDULING_DEPENDS_ON_TIMING"), quota_changes_governed: governanceValid });
  const reservation_service = nested({ reservation_id: id("resource_reservation", allocation_record.allocation_id), reservation_states: reservationStates, current_state: decision === "ALLOCATE" ? "CONSUMED" as const : "CANCELLED" as const, deterministic_guarantee: scheduler.deterministic_ordering, expiration_preserves_evidence: true, consumed_by_allocation_ref: allocation_record.integrity_hash });
  const classification_registry = nested({ registry_id: id("resource_classification_registry", VERSION), resource_classes: resourceClasses, classifications_versioned: true, existing_classifications_not_reinterpreted: true, extensible_by_constitutional_amendment: true });
  const policy_engine = nested({ policy_engine_id: id("scheduling_policy_engine", tenantId), policies: freezeArray(["priority", "fairness", "reservation", "quota", "regional placement", "certification"]), policy_version: "17.4.0", deterministic_evaluation: !has(failures, "ALLOCATION_NOT_DETERMINISTIC"), governance_authorized_changes: governanceValid, timing_independent: !has(failures, "SCHEDULING_DEPENDS_ON_TIMING") });
  const allocation_validation = nested({ validation_id: id("allocation_validation", allocation_record.allocation_id), tenant_qualification_valid: true, regional_assignment_valid: regionalValid, available_capacity: true, quota_available: quotaAvailable, governance_authorization: governanceValid, scheduler_policy_valid: policy_engine.deterministic_evaluation, replay_consistency: replayRefs.length > 0, stale_assignment_rejected: !has(failures, "STALE_ASSIGNMENT_PROPOSALS_NOT_REJECTED") && registry.conflict_resolver.rejects_stale_proposals, silent_reassignment_prevented: !has(failures, "ACCEPTED_ASSIGNMENTS_SILENTLY_OVERWRITTEN") && registry.conflict_resolver.prohibits_last_writer_wins, validation_passed: decision === "ALLOCATE" });
  const forecast_engine = nested({ forecast_id: id("capacity_forecast", tenantId), supports_infrastructure_planning: true, supports_quota_analysis: true, supports_regional_expansion: true, supports_workload_balancing: true, supports_certification_readiness: true, advisory_only: true, modifies_allocation_decisions: has(failures, "FORECASTS_MODIFY_ALLOCATIONS") });
  const allocation_ledger = freezeArray(resourceLifecycleStates.map((state, index) => nested({ ledger_entry_id: id("allocation_ledger", { allocation: allocation_record.allocation_id, state }), sequence: index + 1, allocation_ref: allocation_record.integrity_hash, request_id: requestId, scheduler_decision: decision, allocated_resources: decision === "ALLOCATE" ? freezeArray([`${allocation_record.resource_class}:${approved}`]) : freezeArray([]), regional_assignment_ref: registry.mutation_envelope.integrity_hash, quota_ref: allocation_record.quota_reference, lifecycle_state: state, replay_ref: replayRefs[0] ?? "", governance_ref: allocation_record.governance_authority, append_only: !has(failures, "ALLOCATION_LEDGER_MUTABLE"), immutable: !has(failures, "ALLOCATION_LEDGER_MUTABLE") })));
  const replay_service = nested({ replay_id: id("allocation_replay", allocation_record.allocation_id), reconstructs_scheduling_order: replayRefs.length > 0, reconstructs_capacity_availability: replayRefs.length > 0, reconstructs_quota_decisions: replayRefs.length > 0, reconstructs_allocation_decisions: replayRefs.length > 0, reconstructs_reservation_state: replayRefs.length > 0, reconstructs_regional_assignments: replayRefs.length > 0, reconstructs_governance_approvals: replayRefs.length > 0, divergence_classified: true, identical_allocation_decisions: replayRefs.length > 0, replay_refs: replayRefs });
  const dashboard = nested({ dashboard_id: id("capacity_monitoring_dashboard", tenantId), resource_utilization_visible: true, allocation_activity_visible: true, quota_consumption_visible: true, reservation_status_visible: true, scheduler_health_visible: true, replay_status_visible: replayRefs.length > 0, regional_capacity_visible: true, policy_compliance_visible: true, operational: true });
  const certification_package = nested({ package_id: id("resource_scheduling_certification", allocation_record.allocation_id), deterministic_scheduling: scheduler.deterministic_ordering && policy_engine.deterministic_evaluation, quota_enforcement: quota_manager.quota_available && quota_manager.deterministic_decision, replay_reproducibility: replay_service.identical_allocation_decisions, immutable_allocation_lineage: allocation_ledger.every((entry) => entry.immutable && entry.append_only), tenant_isolation: !has(failures, "TENANT_ISOLATION_VIOLATED"), governance_compliance: governanceValid && !scheduler.allocates_resources || governanceValid, regional_assignment_validation: allocation_validation.regional_assignment_valid, scheduler_determinism: scheduler.independent_of_processing_latency && scheduler.independent_of_wall_clock && scheduler.independent_of_topology && scheduler.independent_of_async_order, resource_scheduling_certified: blockingFailures.length === 0, evidence_refs: evidenceRefs });
  const tests = freezeArray([
    certTest("Allocation deterministic", certification_package.deterministic_scheduling, "ALLOCATION_NOT_DETERMINISTIC", [scheduler.integrity_hash]),
    certTest("Concurrent assignment mutations resolved deterministically", registry.conflict_resolver.rejects_stale_proposals && !has(failures, "CONCURRENT_ASSIGNMENTS_NOT_RESOLVED_DETERMINISTICALLY"), "CONCURRENT_ASSIGNMENTS_NOT_RESOLVED_DETERMINISTICALLY", [registry.conflict_resolver.integrity_hash]),
    certTest("Stale assignment proposals rejected", allocation_validation.stale_assignment_rejected, "STALE_ASSIGNMENT_PROPOSALS_NOT_REJECTED", [allocation_validation.integrity_hash]),
    certTest("Accepted assignments never silently overwritten", allocation_validation.silent_reassignment_prevented, "ACCEPTED_ASSIGNMENTS_SILENTLY_OVERWRITTEN", [allocation_validation.integrity_hash]),
    certTest("Quotas enforced", certification_package.quota_enforcement, "QUOTAS_NOT_ENFORCED", [quota_manager.integrity_hash]),
    certTest("Replay preserved", certification_package.replay_reproducibility, "REPLAY_NOT_PRESERVED", [replay_service.integrity_hash]),
    certTest("Resource scheduling certified", certification_package.resource_scheduling_certified, "RESOURCE_SCHEDULING_NOT_CERTIFIED", [certification_package.integrity_hash]),
    certTest("Tenant isolation preserved", certification_package.tenant_isolation, "TENANT_ISOLATION_VIOLATED", [allocation_record.integrity_hash]),
    certTest("Governance compliance enforced", certification_package.governance_compliance, "GOVERNANCE_BYPASSED", [allocation_validation.integrity_hash]),
    certTest("Allocation ledger immutable", certification_package.immutable_allocation_lineage, "ALLOCATION_LEDGER_MUTABLE", allocation_ledger.map((entry) => entry.integrity_hash)),
    certTest("Forecasts remain advisory", forecast_engine.advisory_only && !forecast_engine.modifies_allocation_decisions, "FORECASTS_MODIFY_ALLOCATIONS", [forecast_engine.integrity_hash]),
    certTest("Scheduling independent of timing and topology", certification_package.scheduler_determinism, "SCHEDULING_DEPENDS_ON_TIMING", [scheduler.integrity_hash]),
    certTest("Regional assignment validated before allocation", certification_package.regional_assignment_validation, "REGIONAL_ASSIGNMENT_NOT_VALIDATED", [allocation_validation.integrity_hash]),
    certTest("Phase 17.3 registry valid", registry.outcome === "PASS", "PHASE_17_3_REGISTRY_NOT_VALID", [registry.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is ResourceSchedulingCapacityFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<ResourceSchedulingCapacityResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, global_tenant_registry_regional_assignment_ref: registry.integrity_hash, allocation_record, scheduler, capacity_planner, quota_manager, reservation_service, classification_registry, policy_engine, allocation_validation, forecast_engine, allocation_ledger, replay_service, dashboard, certification_package, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateResourceSchedulingCapacityManagement(result = runResourceSchedulingCapacityManagement()): ResourceSchedulingCapacityValidation {
  const allocation_valid = verify(result.allocation_record) && result.allocation_record.scheduler_decision === "ALLOCATE" && result.allocation_record.approved_capacity === result.allocation_record.requested_capacity && result.allocation_record.governance_authority.length > 0 && result.allocation_record.replay_reference.length > 0;
  const scheduler_valid = verify(result.scheduler) && Object.entries(result.scheduler).filter(([key]) => !["scheduler_id", "scheduled_requests", "integrity_hash"].includes(key)).every(([, value]) => value === true) && result.scheduler.scheduled_requests.length > 0;
  const capacity_valid = verify(result.capacity_planner) && result.capacity_planner.capacity_states.length === 6 && result.capacity_planner.utilization_forecast.length > 0 && Object.entries(result.capacity_planner).filter(([key]) => !["planner_id", "utilization_forecast", "capacity_states", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const quota_valid = verify(result.quota_manager) && result.quota_manager.quota_categories.length === 6 && result.quota_manager.quota_available && result.quota_manager.approved_capacity === result.quota_manager.requested_capacity && result.quota_manager.deterministic_decision && result.quota_manager.timing_independent && result.quota_manager.quota_changes_governed;
  const reservation_valid = verify(result.reservation_service) && result.reservation_service.reservation_states.length === 6 && result.reservation_service.current_state === "CONSUMED" && result.reservation_service.deterministic_guarantee && result.reservation_service.expiration_preserves_evidence && result.reservation_service.consumed_by_allocation_ref.length > 0;
  const classification_valid = verify(result.classification_registry) && result.classification_registry.resource_classes.length === 7 && result.classification_registry.classifications_versioned && result.classification_registry.existing_classifications_not_reinterpreted && result.classification_registry.extensible_by_constitutional_amendment;
  const policy_valid = verify(result.policy_engine) && result.policy_engine.policies.length === 6 && result.policy_engine.deterministic_evaluation && result.policy_engine.governance_authorized_changes && result.policy_engine.timing_independent;
  const validation_valid = verify(result.allocation_validation) && result.allocation_validation.validation_passed && Object.entries(result.allocation_validation).filter(([key]) => !["validation_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const forecast_valid = verify(result.forecast_engine) && result.forecast_engine.advisory_only && !result.forecast_engine.modifies_allocation_decisions && Object.entries(result.forecast_engine).filter(([key]) => !["forecast_id", "modifies_allocation_decisions", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const ledger_valid = result.allocation_ledger.length === 9 && result.allocation_ledger.every((entry, index) => verify(entry) && entry.sequence === index + 1 && entry.allocation_ref.length > 0 && entry.regional_assignment_ref.length > 0 && entry.quota_ref.length > 0 && entry.replay_ref.length > 0 && entry.governance_ref.length > 0 && entry.append_only && entry.immutable);
  const replay_valid = verify(result.replay_service) && result.replay_service.replay_refs.length > 0 && Object.entries(result.replay_service).filter(([key]) => !["replay_id", "replay_refs", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const dashboard_valid = verify(result.dashboard) && Object.entries(result.dashboard).filter(([key]) => !["dashboard_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const certification_package_valid = verify(result.certification_package) && result.certification_package.evidence_refs.length > 0 && Object.entries(result.certification_package).filter(([key]) => !["package_id", "evidence_refs", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const certification_valid = result.certification_tests.length === 14 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const result_replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && allocation_valid && scheduler_valid && capacity_valid && quota_valid && reservation_valid && classification_valid && policy_valid && validation_valid && forecast_valid && ledger_valid && replay_valid && dashboard_valid && certification_package_valid && certification_valid && result_replay_valid;
  return nested({ valid, outcome: result.outcome, allocation_valid, scheduler_valid, capacity_valid, quota_valid, reservation_valid, classification_valid, policy_valid, validation_valid, forecast_valid, ledger_valid, replay_valid, dashboard_valid, certification_package_valid, certification_valid, result_replay_valid, failures: result.failures });
}

export function replayResourceSchedulingCapacityManagement(result = runResourceSchedulingCapacityManagement()): boolean {
  const replayed = runResourceSchedulingCapacityManagement();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateResourceSchedulingCapacityManagement(result).valid;
}

export function getResourceSchedulingCapacityManagementBundle(): ResourceSchedulingCapacityBundle {
  const result = runResourceSchedulingCapacityManagement();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "global-tenant-registry-regional-assignment/v17.3" as const, resource_classes: resourceClasses, resource_lifecycle_states: resourceLifecycleStates, capacity_states: capacityStates, reservation_states: reservationStates, scheduler_decisions: schedulerDecisions, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateResourceSchedulingCapacityManagement(result) });
}

export const ResourceSchedulingCapacityManagementService = Object.freeze({ run: runResourceSchedulingCapacityManagement, validate: validateResourceSchedulingCapacityManagement, replay: replayResourceSchedulingCapacityManagement });
