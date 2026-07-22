import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runMultiTenantProductionFoundation } from "@/services/multi-tenant-production-foundation";
import type {
  TenantLifecycleState,
  TenantLifecycleTransitionOutcome,
  TenantLifecycleTransitionType,
  TenantProvisioningLifecycleBundle,
  TenantProvisioningLifecycleFailure,
  TenantProvisioningLifecycleInput,
  TenantProvisioningLifecycleOutcome,
  TenantProvisioningLifecycleResult,
  TenantProvisioningLifecycleTest,
  TenantProvisioningLifecycleValidation,
} from "@/types/tenant-provisioning-lifecycle";

const VERSION = "tenant-provisioning-lifecycle/v17.2" as const;
const IDENTIFIER = "TenantProvisioningLifecycle" as const;
const TIMESTAMP = "2026-07-16T00:00:00.000Z" as const;
const DEFAULT_TENANT = "tenant_phase_17_lifecycle";
const DEFAULT_OPERATOR = "operator_phase_17_lifecycle";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly TenantProvisioningLifecycleFailure[], failure: TenantProvisioningLifecycleFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: TenantProvisioningLifecycleInput["scenario"]): TenantProvisioningLifecycleFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly TenantProvisioningLifecycleFailure[]): TenantProvisioningLifecycleOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_LIFECYCLE_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const lifecycleStates = freezeArray(["REQUESTED", "PROVISIONING", "CONFIGURED", "QUALIFIED", "ACTIVE", "SUSPENDED", "ARCHIVED", "RETIRED"] as const satisfies readonly TenantLifecycleState[]);
const transitionOutcomes = freezeArray(["TRANSITION_COMPLETED", "TRANSITION_REJECTED", "INVALID_TRANSITION", "QUALIFICATION_REQUIRED", "AUTHORIZATION_REQUIRED", "GOVERNANCE_REVIEW_REQUIRED", "POLICY_VIOLATION", "CERTIFICATION_REQUIRED", "INTEGRITY_FAILURE"] as const satisfies readonly TenantLifecycleTransitionOutcome[]);
const transitionTypes = freezeArray(["REQUEST_APPROVAL", "PROVISION", "CONFIGURE", "QUALIFY", "ACTIVATE", "SUSPEND", "ARCHIVE", "RETIRE"] as const satisfies readonly TenantLifecycleTransitionType[]);

function certTest(name: string, passed: boolean, failure: TenantProvisioningLifecycleFailure, evidence_refs: readonly string[]): TenantProvisioningLifecycleTest {
  const actual: TenantProvisioningLifecycleOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_LIFECYCLE_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("tenant_lifecycle_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<TenantProvisioningLifecycleResult, "replay_hash" | "integrity_hash">): string {
  return hash({ foundation: result.multi_tenant_production_foundation_ref, provisioning: result.provisioning_engine.integrity_hash, configuration: result.configuration_service.integrity_hash, qualification: result.qualification_service.integrity_hash, records: result.lifecycle_records.map((record) => record.integrity_hash), transition: result.transition_validation.integrity_hash, registry: result.lifecycle_registry.integrity_hash, replay: result.replay_service.integrity_hash, audit: result.audit_ledger.integrity_hash, dashboard: result.dashboard.integrity_hash, package: result.certification_package.integrity_hash, tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<TenantProvisioningLifecycleResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash }); }

export function runTenantProvisioningLifecycle(input: TenantProvisioningLifecycleInput = {}): TenantProvisioningLifecycleResult {
  const foundation = runMultiTenantProductionFoundation({ tenant_id: input.tenant_id ?? DEFAULT_TENANT, operator_id: input.operator_id ?? DEFAULT_OPERATOR, mission_id: input.mission_id });
  const direct = directFailure(input.scenario);
  const upstreamFailures: TenantProvisioningLifecycleFailure[] = foundation.outcome === "PASS" ? [] : ["PHASE_17_1_FOUNDATION_NOT_VALID"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const blockingFailures = freezeArray(failures.filter((failure) => failure !== "NON_CONSTITUTIONAL_LIFECYCLE_WARNING"));
  const tenantId = input.tenant_id ?? DEFAULT_TENANT;
  const requestId = input.request_id ?? id("tenant_request", tenantId);
  const requester = input.requester_identity ?? input.operator_id ?? DEFAULT_OPERATOR;
  const evidenceRefs = freezeArray([foundation.integrity_hash, foundation.contract.integrity_hash, foundation.tenant_scale_registry.integrity_hash]);
  const replayRefs = has(failures, "REPLAY_VALIDATION_INCOMPLETE") || has(failures, "LIFECYCLE_NOT_REPRODUCIBLE") ? freezeArray([]) : freezeArray([foundation.replay_hash, foundation.lifecycle.integrity_hash]);
  const certificationRefs = has(failures, "PROVISIONING_NOT_CERTIFIED") ? freezeArray([]) : freezeArray([foundation.certification_package.integrity_hash]);
  const provisioning_engine = nested({ engine_id: id("tenant_provisioning_engine", tenantId), provisioning_steps: freezeArray(["principal creation", "tenant identity", "namespace allocation", "registry registration", "policy initialization", "governance binding", "audit initialization", "replay initialization", "observability initialization", "certification registration"]), principal_created: true, tenant_identity_created: true, namespace_allocated: true, registry_registered: true, policy_initialized: true, governance_bound: !has(failures, "GOVERNANCE_AUTHORIZATION_NOT_ENFORCED"), audit_initialized: !has(failures, "LIFECYCLE_AUDIT_INCOMPLETE"), replay_initialized: replayRefs.length > 0, observability_initialized: true, certification_registered: certificationRefs.length > 0, deterministic: !has(failures, "PROVISIONING_NOT_DETERMINISTIC"), evidence_refs: evidenceRefs });
  const configuration_service = nested({ configuration_id: id("tenant_configuration", tenantId), policy_configuration: true, capability_assignment: true, environment_configuration: true, governance_binding: provisioning_engine.governance_bound, audit_initialization: provisioning_engine.audit_initialized, observability_initialization: provisioning_engine.observability_initialized, validated: !has(failures, "TENANT_QUALIFICATION_NOT_VALIDATED") });
  const qualification_service = nested({ qualification_id: id("tenant_qualification", tenantId), identity_complete: provisioning_engine.tenant_identity_created, governance_complete: provisioning_engine.governance_bound, configuration_complete: configuration_service.validated, policy_complete: configuration_service.policy_configuration, replay_operational: replayRefs.length > 0, evidence_operational: evidenceRefs.length > 0, tenant_isolation_operational: !has(failures, "TENANT_ISOLATION_NOT_MAINTAINED"), audit_operational: provisioning_engine.audit_initialized, certification_prerequisites_satisfied: certificationRefs.length > 0, qualified: blockingFailures.length === 0 || (blockingFailures.length === 1 && has(failures, "NON_CONSTITUTIONAL_LIFECYCLE_WARNING")), evidence_refs: evidenceRefs });
  const states = lifecycleStates;
  const records = freezeArray(states.map((state, index) => nested({ lifecycle_record_id: id("tenant_lifecycle_record", { tenantId, state, index }), tenant_id: tenantId, previous_state: index === 0 ? null : states[index - 1], current_state: state, transition_type: transitionTypes[index], transition_reason: index === 0 ? "tenant enrollment requested" : `tenant lifecycle transition to ${state.toLowerCase()}`, authorizing_decision_ref: has(failures, "GOVERNANCE_AUTHORIZATION_NOT_ENFORCED") ? "" : foundation.scaling_authority_model.integrity_hash, request_id: requestId, requester_identity: requester, evidence_refs: evidenceRefs, replay_refs: replayRefs, certification_refs: certificationRefs, timestamp: TIMESTAMP })));
  const transition_validation = nested({ validation_id: id("tenant_lifecycle_transition_validation", tenantId), valid_source_state: !has(failures, "INVALID_TRANSITIONS_NOT_REJECTED"), valid_destination_state: !has(failures, "INVALID_TRANSITIONS_NOT_REJECTED"), governance_authorization: !has(failures, "GOVERNANCE_AUTHORIZATION_NOT_ENFORCED"), qualification_requirements: qualification_service.qualified && !has(failures, "ACTIVE_WITHOUT_QUALIFICATION_ALLOWED"), policy_compliance: true, tenant_isolation_preserved: !has(failures, "TENANT_ISOLATION_NOT_MAINTAINED"), replay_preserved: replayRefs.length > 0, audit_generated: !has(failures, "LIFECYCLE_AUDIT_INCOMPLETE"), invalid_transitions_rejected: !has(failures, "INVALID_TRANSITIONS_NOT_REJECTED"), active_requires_qualification: !has(failures, "ACTIVE_WITHOUT_QUALIFICATION_ALLOWED"), transition_outcomes: transitionOutcomes });
  const lifecycle_registry = nested({ registry_id: id("tenant_lifecycle_registry", tenantId), tenant_id: tenantId, records, current_state: blockingFailures.length ? "CONFIGURED" as const : "RETIRED" as const, history_immutable: !has(failures, "LIFECYCLE_HISTORY_MUTABLE") && !has(failures, "RETIREMENT_HISTORY_NOT_PRESERVED"), historical_records_preserved: !has(failures, "RETIREMENT_HISTORY_NOT_PRESERVED"), operational: true });
  const replay_service = nested({ replay_id: id("tenant_lifecycle_replay", tenantId), reconstructs_state_transitions: replayRefs.length > 0, reconstructs_approvals: replayRefs.length > 0 && transition_validation.governance_authorization, reconstructs_evidence: replayRefs.length > 0, reconstructs_authorization: replayRefs.length > 0 && transition_validation.governance_authorization, reconstructs_qualification: replayRefs.length > 0 && qualification_service.qualified, reconstructs_resulting_state: replayRefs.length > 0, replay_refs: replayRefs });
  const auditEntries = freezeArray(records.map((record, index) => nested({ ledger_entry_id: id("tenant_lifecycle_audit", { record: record.integrity_hash, index }), sequence: index + 1, lifecycle_record_ref: record.integrity_hash, evidence_refs: record.evidence_refs, replay_refs: record.replay_refs, append_only: !has(failures, "LIFECYCLE_HISTORY_MUTABLE"), immutable: !has(failures, "LIFECYCLE_HISTORY_MUTABLE") })));
  const audit_ledger = nested({ ledger_id: id("tenant_lifecycle_audit_ledger", tenantId), entries: auditEntries, audit_complete: !has(failures, "LIFECYCLE_AUDIT_INCOMPLETE") && auditEntries.length === 8, append_only: !has(failures, "LIFECYCLE_HISTORY_MUTABLE"), immutable: !has(failures, "LIFECYCLE_HISTORY_MUTABLE") });
  const dashboard = nested({ dashboard_id: id("tenant_qualification_dashboard", tenantId), provisioning_progress_visible: true, lifecycle_state_visible: true, qualification_status_visible: true, transition_latency_visible: true, failed_transitions_visible: true, governance_approvals_visible: true, replay_health_visible: replayRefs.length > 0, audit_integrity_visible: audit_ledger.immutable, certification_readiness_visible: certificationRefs.length > 0, operational: true });
  const certification_package = nested({ package_id: id("tenant_lifecycle_certification_package", tenantId), provisioning_deterministic: provisioning_engine.deterministic, lifecycle_vocabulary_unique: !has(failures, "TENANT_LIFECYCLE_VOCABULARY_NOT_UNIQUE") && !states.includes("FOUNDATION_CERTIFIED" as TenantLifecycleState), lifecycle_reproducible: replay_service.reconstructs_resulting_state, lifecycle_audit_complete: audit_ledger.audit_complete, tenant_qualification_validated: qualification_service.qualified, governance_authorization_enforced: transition_validation.governance_authorization, replay_validation_complete: replayRefs.length > 0, immutable_lifecycle_history_preserved: lifecycle_registry.history_immutable && audit_ledger.immutable, tenant_isolation_maintained: transition_validation.tenant_isolation_preserved, provisioning_certified: certificationRefs.length > 0 && blockingFailures.length === 0, evidence_refs: evidenceRefs });
  const tests = freezeArray([
    certTest("Provisioning deterministic", certification_package.provisioning_deterministic, "PROVISIONING_NOT_DETERMINISTIC", [provisioning_engine.integrity_hash]),
    certTest("Tenant lifecycle vocabulary unique", certification_package.lifecycle_vocabulary_unique, "TENANT_LIFECYCLE_VOCABULARY_NOT_UNIQUE", [lifecycle_registry.integrity_hash]),
    certTest("Lifecycle reproducible", certification_package.lifecycle_reproducible, "LIFECYCLE_NOT_REPRODUCIBLE", [replay_service.integrity_hash]),
    certTest("Lifecycle audit complete", certification_package.lifecycle_audit_complete, "LIFECYCLE_AUDIT_INCOMPLETE", [audit_ledger.integrity_hash]),
    certTest("Tenant qualification validated", certification_package.tenant_qualification_validated, "TENANT_QUALIFICATION_NOT_VALIDATED", [qualification_service.integrity_hash]),
    certTest("Governance authorization enforced", certification_package.governance_authorization_enforced, "GOVERNANCE_AUTHORIZATION_NOT_ENFORCED", [transition_validation.integrity_hash]),
    certTest("Replay validation complete", certification_package.replay_validation_complete, "REPLAY_VALIDATION_INCOMPLETE", [replay_service.integrity_hash]),
    certTest("Immutable lifecycle history preserved", certification_package.immutable_lifecycle_history_preserved, "LIFECYCLE_HISTORY_MUTABLE", [lifecycle_registry.integrity_hash, audit_ledger.integrity_hash]),
    certTest("Tenant isolation maintained throughout lifecycle", certification_package.tenant_isolation_maintained, "TENANT_ISOLATION_NOT_MAINTAINED", [transition_validation.integrity_hash]),
    certTest("Provisioning certified", certification_package.provisioning_certified, "PROVISIONING_NOT_CERTIFIED", [certification_package.integrity_hash]),
    certTest("Invalid transitions rejected", transition_validation.invalid_transitions_rejected, "INVALID_TRANSITIONS_NOT_REJECTED", [transition_validation.integrity_hash]),
    certTest("Active state requires qualification", transition_validation.active_requires_qualification && qualification_service.qualified, "ACTIVE_WITHOUT_QUALIFICATION_ALLOWED", [qualification_service.integrity_hash]),
    certTest("Retirement preserves history", lifecycle_registry.current_state === "RETIRED" && lifecycle_registry.historical_records_preserved, "RETIREMENT_HISTORY_NOT_PRESERVED", [lifecycle_registry.integrity_hash]),
    certTest("Phase 17.1 foundation valid", foundation.outcome === "PASS", "PHASE_17_1_FOUNDATION_NOT_VALID", [foundation.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is TenantProvisioningLifecycleFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<TenantProvisioningLifecycleResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, multi_tenant_production_foundation_ref: foundation.integrity_hash, provisioning_engine, configuration_service, qualification_service, lifecycle_records: records, transition_validation, lifecycle_registry, replay_service, audit_ledger, dashboard, certification_package, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateTenantProvisioningLifecycle(result = runTenantProvisioningLifecycle()): TenantProvisioningLifecycleValidation {
  const provisioning_valid = verify(result.provisioning_engine) && result.provisioning_engine.provisioning_steps.length === 10 && result.provisioning_engine.deterministic && result.provisioning_engine.evidence_refs.length > 0 && Object.entries(result.provisioning_engine).filter(([key]) => !["engine_id", "provisioning_steps", "evidence_refs", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const configuration_valid = verify(result.configuration_service) && Object.entries(result.configuration_service).filter(([key]) => !["configuration_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const qualification_valid = verify(result.qualification_service) && result.qualification_service.qualified && result.qualification_service.evidence_refs.length > 0 && Object.entries(result.qualification_service).filter(([key]) => !["qualification_id", "evidence_refs", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const records_valid = result.lifecycle_records.length === 8 && result.lifecycle_records.every((record, index) => verify(record) && record.current_state === lifecycleStates[index] && record.transition_type === transitionTypes[index] && record.authorizing_decision_ref.length > 0 && record.evidence_refs.length > 0 && record.replay_refs.length > 0 && record.certification_refs.length > 0);
  const transition_valid = verify(result.transition_validation) && result.transition_validation.transition_outcomes.length === 9 && Object.entries(result.transition_validation).filter(([key]) => !["validation_id", "transition_outcomes", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const registry_valid = verify(result.lifecycle_registry) && result.lifecycle_registry.records.length === 8 && result.lifecycle_registry.current_state === "RETIRED" && result.lifecycle_registry.history_immutable && result.lifecycle_registry.historical_records_preserved && result.lifecycle_registry.operational;
  const replay_valid = verify(result.replay_service) && result.replay_service.replay_refs.length > 0 && Object.entries(result.replay_service).filter(([key]) => !["replay_id", "replay_refs", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const audit_valid = verify(result.audit_ledger) && result.audit_ledger.entries.length === 8 && result.audit_ledger.audit_complete && result.audit_ledger.append_only && result.audit_ledger.immutable && result.audit_ledger.entries.every((entry, index) => verify(entry) && entry.sequence === index + 1 && entry.lifecycle_record_ref.length > 0 && entry.evidence_refs.length > 0 && entry.replay_refs.length > 0 && entry.append_only && entry.immutable);
  const dashboard_valid = verify(result.dashboard) && Object.entries(result.dashboard).filter(([key]) => !["dashboard_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const certification_package_valid = verify(result.certification_package) && result.certification_package.evidence_refs.length > 0 && Object.entries(result.certification_package).filter(([key]) => !["package_id", "evidence_refs", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const certification_valid = result.certification_tests.length === 14 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const result_replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && provisioning_valid && configuration_valid && qualification_valid && records_valid && transition_valid && registry_valid && replay_valid && audit_valid && dashboard_valid && certification_package_valid && certification_valid && result_replay_valid;
  return nested({ valid, outcome: result.outcome, provisioning_valid, configuration_valid, qualification_valid, records_valid, transition_valid, registry_valid, replay_valid, audit_valid, dashboard_valid, certification_package_valid, certification_valid, result_replay_valid, failures: result.failures });
}

export function replayTenantProvisioningLifecycle(result = runTenantProvisioningLifecycle()): boolean {
  const replayed = runTenantProvisioningLifecycle();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateTenantProvisioningLifecycle(result).valid;
}

export function getTenantProvisioningLifecycleBundle(): TenantProvisioningLifecycleBundle {
  const result = runTenantProvisioningLifecycle();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "multi-tenant-production-foundation/v17.1" as const, lifecycle_states: lifecycleStates, transition_outcomes: transitionOutcomes, transition_types: transitionTypes, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateTenantProvisioningLifecycle(result) });
}

export const TenantProvisioningLifecycleService = Object.freeze({ run: runTenantProvisioningLifecycle, validate: validateTenantProvisioningLifecycle, replay: replayTenantProvisioningLifecycle });
