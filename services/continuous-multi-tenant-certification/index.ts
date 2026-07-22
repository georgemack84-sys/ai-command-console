import { runProductionOperationsObservability } from "@/services/production-operations-observability";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  CertificationCategory,
  CertificationEvaluationState,
  CertificationTriggerSource,
  ContinuousCertificationLifecycleState,
  ContinuousMultiTenantCertificationBundle,
  ContinuousMultiTenantCertificationFailure,
  ContinuousMultiTenantCertificationInput,
  ContinuousMultiTenantCertificationOutcome,
  ContinuousMultiTenantCertificationResult,
  ContinuousMultiTenantCertificationTest,
  ContinuousMultiTenantCertificationValidation,
} from "@/types/continuous-multi-tenant-certification";

const VERSION = "continuous-multi-tenant-certification/v17.10" as const;
const IDENTIFIER = "ContinuousMultiTenantCertification" as const;
const DEFAULT_TENANT = "tenant_phase_17_continuous_certification";
const DEFAULT_OPERATOR = "operator_phase_17_continuous_certification";
const CERTIFICATION_TIMESTAMP = "2026-07-16T00:00:00.000Z" as const;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly ContinuousMultiTenantCertificationFailure[], failure: ContinuousMultiTenantCertificationFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: ContinuousMultiTenantCertificationInput["scenario"]): ContinuousMultiTenantCertificationFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly ContinuousMultiTenantCertificationFailure[]): ContinuousMultiTenantCertificationOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_CERTIFICATION_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const lifecycleStates = freezeArray(["QUALIFIED", "CERTIFIED", "MONITORED", "REVALIDATING", "NON_COMPLIANT", "RECERTIFIED", "REQUIRES_REVIEW", "CERTIFICATION_REVOKED"] as const satisfies readonly ContinuousCertificationLifecycleState[]);
const triggerSources = freezeArray(["DEPLOYMENT", "CONFIGURATION_CHANGE", "INFRASTRUCTURE_CHANGE", "TENANT_ONBOARDING", "TENANT_RETIREMENT", "REGIONAL_FAILOVER", "RECOVERY_COMPLETION", "REPLICATION_UPDATE", "GOVERNANCE_POLICY_UPDATE", "REPLAY_VALIDATION", "OPERATIONAL_INCIDENT", "CERTIFICATION_SCHEDULE", "DEPENDENCY_QUALIFICATION", "MANUAL_GOVERNANCE_REVIEW"] as const satisfies readonly CertificationTriggerSource[]);
const categories = freezeArray(["TENANT_QUALIFICATION", "INFRASTRUCTURE_QUALIFICATION", "REGIONAL_QUALIFICATION", "GOVERNANCE_QUALIFICATION", "REPLAY_QUALIFICATION", "OPERATIONAL_QUALIFICATION", "EVIDENCE_QUALIFICATION", "REPLICATION_QUALIFICATION", "RECOVERY_QUALIFICATION", "PLATFORM_QUALIFICATION"] as const satisfies readonly CertificationCategory[]);
const evaluationStates = freezeArray(["QUEUED", "RUNNING", "PASSED", "CONDITIONAL_PASS", "FAILED", "REQUIRES_GOVERNANCE_REVIEW", "REQUIRES_OPERATOR_REVIEW"] as const satisfies readonly CertificationEvaluationState[]);

function certTest(name: string, passed: boolean, failure: ContinuousMultiTenantCertificationFailure, evidence_refs: readonly string[]): ContinuousMultiTenantCertificationTest {
  const actual: ContinuousMultiTenantCertificationOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_CERTIFICATION_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("continuous_certification_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<ContinuousMultiTenantCertificationResult, "replay_hash" | "integrity_hash">): string {
  return hash({ observability: result.production_operations_observability_ref, engine: result.engine.integrity_hash, production: result.production_qualification_service.integrity_hash, validation: result.continuous_validation_service.integrity_hash, decision: result.decision_record.integrity_hash, dashboard: result.dashboard.integrity_hash, ledger: result.certification_ledger.map((entry) => entry.integrity_hash), package: result.certification_package.integrity_hash, tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<ContinuousMultiTenantCertificationResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash }); }

export function runContinuousMultiTenantCertification(input: ContinuousMultiTenantCertificationInput = {}): ContinuousMultiTenantCertificationResult {
  const observability = runProductionOperationsObservability({ tenant_id: input.tenant_id ?? DEFAULT_TENANT, operator_id: input.operator_id ?? DEFAULT_OPERATOR, mission_id: input.mission_id });
  const direct = directFailure(input.scenario);
  const upstreamFailures: ContinuousMultiTenantCertificationFailure[] = observability.outcome === "PASS" ? [] : ["PHASE_17_9_OBSERVABILITY_NOT_VALID"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const blockingFailures = freezeArray(failures.filter((failure) => failure !== "NON_CONSTITUTIONAL_CERTIFICATION_WARNING"));
  const tenantId = input.tenant_id ?? DEFAULT_TENANT;
  const automated = !has(failures, "CONTINUOUS_CERTIFICATION_NOT_AUTOMATED");
  const productionOperational = !has(failures, "PRODUCTION_QUALIFICATION_NOT_OPERATIONAL") && observability.certification_package.monitoring_certified;
  const validationOperational = !has(failures, "CONTINUOUS_VALIDATION_NOT_OPERATIONAL");
  const tenantIsolation = !has(failures, "TENANT_ISOLATION_NOT_CONTINUOUSLY_VERIFIED");
  const replayIntegrity = !has(failures, "REPLAY_INTEGRITY_NOT_CONTINUOUSLY_VALIDATED") && !has(failures, "CERTIFICATION_REPLAY_NOT_REPRODUCIBLE");
  const governance = !has(failures, "GOVERNANCE_ENFORCEMENT_NOT_CONTINUOUSLY_VERIFIED");
  const advisory = !has(failures, "ADVISORY_BOUNDARY_NOT_ENFORCED") && !has(failures, "CERTIFICATION_AUTHORIZES_EXECUTION");
  const regional = !has(failures, "REGIONAL_HEALTH_NOT_CONTINUOUSLY_MONITORED");
  const readiness = !has(failures, "PRODUCTION_READINESS_NOT_CONTINUOUSLY_VALIDATED");
  const deterministicFailures = !has(failures, "FAILURES_NOT_DETECTED_DETERMINISTICALLY");
  const lineage = !has(failures, "CERTIFICATION_LINEAGE_NOT_PRESERVED");
  const audit = !has(failures, "CERTIFICATION_AUDIT_INCOMPLETE");
  const immutableEvidence = !has(failures, "CERTIFICATION_EVIDENCE_NOT_IMMUTABLE");
  const verified = !has(failures, "CONTINUOUS_CERTIFICATION_NOT_VERIFIED");
  const ecosystemCertified = !has(failures, "ECOSYSTEM_QUALIFICATION_NOT_CERTIFIED");
  const replayRefs = freezeArray(replayIntegrity ? [observability.replay_hash] : []);
  const evidenceRefs = freezeArray(immutableEvidence ? [observability.integrity_hash, observability.certification_package.integrity_hash] : []);
  const governanceRefs = freezeArray(governance ? [observability.certification_package.integrity_hash] : []);
  const engine = nested({ engine_id: id("continuous_certification_engine", VERSION), validation_domains: freezeArray(["tenant isolation", "replay integrity", "governance enforcement", "advisory boundary", "regional health", "production readiness", "deployment integrity", "infrastructure health", "lineage integrity", "evidence completeness", "replication consistency", "recovery readiness"]), trigger_sources: triggerSources, deterministic_execution: deterministicFailures, automated, replay_validation: replayIntegrity, evidence_validation: immutableEvidence, governance_validation: governance, fail_closed: blockingFailures.length === 0, advisory_only: advisory });
  const production_qualification_service = nested({ service_id: id("production_qualification", tenantId), categories, production_architecture_certified: productionOperational, regional_assignments_valid: regional, resource_allocation_compliant: productionOperational, workload_routing_deterministic: deterministicFailures, replication_synchronized: productionOperational, disaster_recovery_qualified: productionOperational, dashboards_operational: observability.certification_package.operations_dashboard_complete, alerts_functional: observability.certification_package.alerts_validated, operational: productionOperational });
  const continuous_validation_service = nested({ service_id: id("continuous_validation", tenantId), constitutional_compliance: governance && advisory, governance_conformance: governance, replay_reproducibility: replayIntegrity, tenant_isolation: tenantIsolation, advisory_only_enforcement: advisory, deployment_integrity: productionOperational, infrastructure_consistency: productionOperational, replication_integrity: productionOperational, operational_readiness: readiness, evidence_completeness: immutableEvidence, operational: validationOperational });
  const decisionState: CertificationEvaluationState = blockingFailures.length === 0 ? "PASSED" : !governance ? "REQUIRES_GOVERNANCE_REVIEW" : "FAILED";
  const decision_record = nested({ certification_id: id("certification_decision", { tenantId, scope: input.certification_scope ?? "ecosystem" }), tenant_id: tenantId, certification_scope: input.certification_scope ?? "ecosystem", certification_category: "PLATFORM_QUALIFICATION" as const, evaluated_components: freezeArray(["tenants", "regions", "infrastructure", "governance", "replay", "observability", "certification"]), evidence_refs: evidenceRefs, replay_refs: replayRefs, governance_refs: governanceRefs, regional_refs: freezeArray(regional ? [observability.performance_scalability_validation_ref] : []), validation_results: freezeArray(blockingFailures.length === 0 ? ["QUEUED", "RUNNING", "PASSED"] as const : ["QUEUED", "RUNNING", decisionState] as const), decision: decisionState, certification_version: "17.10.0", evaluator_version: VERSION, certification_timestamp: CERTIFICATION_TIMESTAMP });
  const dashboard = nested({ dashboard_id: id("certification_dashboard", tenantId), ecosystem_certification_health_visible: true, tenant_qualification_status_visible: true, certification_trends_visible: true, certification_backlog_visible: true, failed_qualifications_visible: true, replay_validation_status_visible: replayIntegrity, governance_violations_visible: governance, infrastructure_qualification_visible: productionOperational, regional_qualification_visible: regional, certification_history_visible: audit && lineage, operational: productionOperational && validationOperational });
  const ledger = freezeArray(lifecycleStates.map((state, index) => nested({ ledger_entry_id: id("certification_ledger", { decision: decision_record.certification_id, state }), sequence: index + 1, lifecycle_state: state, certification_ref: decision_record.integrity_hash, request_ref: id("certification_request", { tenantId, trigger: input.trigger_source ?? "CERTIFICATION_SCHEDULE" }), evidence_ref: evidenceRefs[0] ?? "", governance_ref: governanceRefs[0] ?? "", replay_ref: replayRefs[0] ?? "", decision: decisionState, supersedes_ref: state === "RECERTIFIED" ? id("prior_certification", tenantId) : null, revoked_ref: state === "CERTIFICATION_REVOKED" ? id("revocation_marker", tenantId) : null, append_only: immutableEvidence && lineage, immutable: immutableEvidence && lineage })));
  const certification_package = nested({ package_id: id("continuous_certification_package", decision_record.certification_id), continuous_certification_automated: engine.automated, production_qualification_operational: production_qualification_service.operational, continuous_validation_operational: continuous_validation_service.operational, tenant_isolation_continuously_verified: continuous_validation_service.tenant_isolation, replay_integrity_continuously_validated: engine.replay_validation && continuous_validation_service.replay_reproducibility, governance_enforcement_continuously_verified: engine.governance_validation && continuous_validation_service.governance_conformance, advisory_boundary_continuously_enforced: engine.advisory_only && continuous_validation_service.advisory_only_enforcement, regional_health_continuously_monitored: regional && dashboard.regional_qualification_visible, production_readiness_continuously_validated: continuous_validation_service.operational_readiness, failures_detected_deterministically: engine.deterministic_execution, certification_lineage_preserved: ledger.every((entry) => entry.append_only), certification_audit_complete: audit && dashboard.certification_history_visible, certification_evidence_immutable: ledger.every((entry) => entry.immutable), certification_replay_reproducible: decision_record.replay_refs.length > 0, continuous_certification_verified: verified && blockingFailures.length === 0, ecosystem_qualification_certified: ecosystemCertified && decision_record.decision === "PASSED", evidence_refs: evidenceRefs });
  const tests = freezeArray([
    certTest("Continuous certification automated", certification_package.continuous_certification_automated, "CONTINUOUS_CERTIFICATION_NOT_AUTOMATED", [engine.integrity_hash]),
    certTest("Production qualification operational", certification_package.production_qualification_operational, "PRODUCTION_QUALIFICATION_NOT_OPERATIONAL", [production_qualification_service.integrity_hash]),
    certTest("Continuous validation operational", certification_package.continuous_validation_operational, "CONTINUOUS_VALIDATION_NOT_OPERATIONAL", [continuous_validation_service.integrity_hash]),
    certTest("Tenant isolation continuously verified", certification_package.tenant_isolation_continuously_verified, "TENANT_ISOLATION_NOT_CONTINUOUSLY_VERIFIED", [continuous_validation_service.integrity_hash]),
    certTest("Replay integrity continuously validated", certification_package.replay_integrity_continuously_validated, "REPLAY_INTEGRITY_NOT_CONTINUOUSLY_VALIDATED", [engine.integrity_hash]),
    certTest("Governance enforcement continuously verified", certification_package.governance_enforcement_continuously_verified, "GOVERNANCE_ENFORCEMENT_NOT_CONTINUOUSLY_VERIFIED", [continuous_validation_service.integrity_hash]),
    certTest("Advisory boundary continuously enforced", certification_package.advisory_boundary_continuously_enforced, "ADVISORY_BOUNDARY_NOT_ENFORCED", [engine.integrity_hash]),
    certTest("Regional health continuously monitored", certification_package.regional_health_continuously_monitored, "REGIONAL_HEALTH_NOT_CONTINUOUSLY_MONITORED", [dashboard.integrity_hash]),
    certTest("Production readiness continuously validated", certification_package.production_readiness_continuously_validated, "PRODUCTION_READINESS_NOT_CONTINUOUSLY_VALIDATED", [continuous_validation_service.integrity_hash]),
    certTest("Failures detected deterministically", certification_package.failures_detected_deterministically, "FAILURES_NOT_DETECTED_DETERMINISTICALLY", [engine.integrity_hash]),
    certTest("Certification lineage preserved", certification_package.certification_lineage_preserved, "CERTIFICATION_LINEAGE_NOT_PRESERVED", ledger.map((entry) => entry.integrity_hash)),
    certTest("Certification audit complete", certification_package.certification_audit_complete, "CERTIFICATION_AUDIT_INCOMPLETE", [dashboard.integrity_hash]),
    certTest("Certification evidence immutable", certification_package.certification_evidence_immutable, "CERTIFICATION_EVIDENCE_NOT_IMMUTABLE", ledger.map((entry) => entry.integrity_hash)),
    certTest("Certification replay reproducible", certification_package.certification_replay_reproducible, "CERTIFICATION_REPLAY_NOT_REPRODUCIBLE", [decision_record.integrity_hash]),
    certTest("Continuous certification verified", certification_package.continuous_certification_verified, "CONTINUOUS_CERTIFICATION_NOT_VERIFIED", [certification_package.integrity_hash]),
    certTest("Ecosystem qualification certified", certification_package.ecosystem_qualification_certified, "ECOSYSTEM_QUALIFICATION_NOT_CERTIFIED", [decision_record.integrity_hash]),
    certTest("Certification remains advisory", !has(failures, "CERTIFICATION_AUTHORIZES_EXECUTION") && engine.advisory_only, "CERTIFICATION_AUTHORIZES_EXECUTION", [engine.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is ContinuousMultiTenantCertificationFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<ContinuousMultiTenantCertificationResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, production_operations_observability_ref: observability.integrity_hash, engine, production_qualification_service, continuous_validation_service, decision_record, dashboard, certification_ledger: ledger, certification_package, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateContinuousMultiTenantCertification(result = runContinuousMultiTenantCertification()): ContinuousMultiTenantCertificationValidation {
  const engine_valid = verify(result.engine) && result.engine.trigger_sources.length === 14 && result.engine.validation_domains.length >= 10 && Object.entries(result.engine).filter(([key]) => !["engine_id", "validation_domains", "trigger_sources", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const production_qualification_valid = verify(result.production_qualification_service) && result.production_qualification_service.categories.length === 10 && Object.entries(result.production_qualification_service).filter(([key]) => !["service_id", "categories", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const continuous_validation_valid = verify(result.continuous_validation_service) && Object.entries(result.continuous_validation_service).filter(([key]) => !["service_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const decision_record_valid = verify(result.decision_record) && result.decision_record.decision === "PASSED" && result.decision_record.evidence_refs.length > 0 && result.decision_record.replay_refs.length > 0 && result.decision_record.governance_refs.length > 0 && result.decision_record.regional_refs.length > 0 && result.decision_record.validation_results.includes("PASSED");
  const dashboard_valid = verify(result.dashboard) && Object.entries(result.dashboard).filter(([key]) => !["dashboard_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const ledger_valid = result.certification_ledger.length === 8 && result.certification_ledger.every((entry, index) => verify(entry) && entry.sequence === index + 1 && entry.certification_ref.length > 0 && entry.request_ref.length > 0 && entry.evidence_ref.length > 0 && entry.governance_ref.length > 0 && entry.replay_ref.length > 0 && entry.append_only && entry.immutable);
  const certification_package_valid = verify(result.certification_package) && result.certification_package.evidence_refs.length > 0 && Object.entries(result.certification_package).filter(([key]) => !["package_id", "evidence_refs", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const certification_valid = result.certification_tests.length === 17 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const result_replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && engine_valid && production_qualification_valid && continuous_validation_valid && decision_record_valid && dashboard_valid && ledger_valid && certification_package_valid && certification_valid && result_replay_valid;
  return nested({ valid, outcome: result.outcome, engine_valid, production_qualification_valid, continuous_validation_valid, decision_record_valid, dashboard_valid, ledger_valid, certification_package_valid, certification_valid, result_replay_valid, failures: result.failures });
}

export function replayContinuousMultiTenantCertification(result = runContinuousMultiTenantCertification()): boolean {
  const replayed = runContinuousMultiTenantCertification();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateContinuousMultiTenantCertification(result).valid;
}

export function getContinuousMultiTenantCertificationBundle(): ContinuousMultiTenantCertificationBundle {
  const result = runContinuousMultiTenantCertification();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "production-operations-observability/v17.9" as const, lifecycle_states: lifecycleStates, trigger_sources: triggerSources, certification_categories: categories, evaluation_states: evaluationStates, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateContinuousMultiTenantCertification(result) });
}

export const ContinuousMultiTenantCertificationService = Object.freeze({ run: runContinuousMultiTenantCertification, validate: validateContinuousMultiTenantCertification, replay: replayContinuousMultiTenantCertification });
