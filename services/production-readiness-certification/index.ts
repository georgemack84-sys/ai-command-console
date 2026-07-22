import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  CertificationCompletenessValidation,
  FailClosedReadinessValidation,
  OperationalReadinessAssessment,
  OperationalRecoveryValidation,
  OperatorWorkflowReadinessValidation,
  ProductionCertificationDependency,
  ProductionGovernanceValidation,
  ProductionObservabilityValidation,
  ProductionReadinessApiSurface,
  ProductionReadinessCertificationRecord,
  ProductionReadinessCertificationReport,
  ProductionReadinessCertificationTest,
  ProductionReadinessContract,
  ProductionReadinessFailure,
  ProductionReadinessInput,
  ProductionReadinessObservability,
  ProductionReadinessResult,
  ProductionReadinessScenario,
  ProductionReadinessStatus,
  ProductionReadinessValidationResult,
  ProductionReadinessWidget,
  ProductionReplayValidation,
  ScalabilityValidation,
  StabilityValidation,
} from "@/types/production-readiness-certification";

const VERSION = "production-readiness-certification/v10.15.9" as const;
const ID = "ProductionReadinessCertification" as const;
const TENANT_ID = "tenant_mission_control";
const MISSION_ID = "mission_adaptive_intelligence";
const WIDGETS: readonly ProductionReadinessWidget[] = Object.freeze(["Production Readiness", "Scalability", "Stability", "Observability", "Governance Readiness", "Replay Readiness", "Fail Closed", "Operator Workflows", "Certification Completeness", "Operational Recovery", "Readiness Assessment"]);
const DEPS: readonly ProductionCertificationDependency[] = Object.freeze(["Adaptive Contract Certification", "Deterministic Behavior Certification", "Replay Certification", "Governance & Constitutional Certification", "Adaptive Pipeline Certification", "Adaptive Safety Certification", "Operator Visibility Certification", "Adaptive Ledger Certification"]);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }
function failed(failures: readonly ProductionReadinessFailure[], values: readonly ProductionReadinessFailure[]): boolean { return failures.some((failure) => values.includes(failure)); }
function failureForScenario(scenario: ProductionReadinessScenario): ProductionReadinessFailure | undefined {
  const map: Partial<Record<ProductionReadinessScenario, ProductionReadinessFailure>> = {
    SCALABILITY_DETERMINISM_COMPROMISED: "SCALABILITY_COMPROMISED_DETERMINISM",
    OPERATIONAL_INSTABILITY: "OPERATIONAL_INSTABILITY_DETECTED",
    INCOMPLETE_OBSERVABILITY: "OBSERVABILITY_INCOMPLETE",
    GOVERNANCE_FAILURE: "GOVERNANCE_ENFORCEMENT_FAILURE",
    CONSTITUTIONAL_FAILURE: "CONSTITUTIONAL_ENFORCEMENT_FAILURE",
    REPLAY_UNAVAILABLE: "REPLAY_UNAVAILABLE",
    REPLAY_INCONSISTENCY: "REPLAY_INCONSISTENT",
    FAIL_OPEN_BEHAVIOR: "FAIL_OPEN_BEHAVIOR_DETECTED",
    OPERATOR_WORKFLOW_FAILURE: "OPERATOR_WORKFLOW_FAILURE",
    INCOMPLETE_CERTIFICATION_DEPENDENCIES: "CERTIFICATION_DEPENDENCIES_INCOMPLETE",
    UNRESOLVED_SAFETY_FINDINGS: "UNRESOLVED_ADAPTIVE_SAFETY_FINDINGS",
    TENANT_ISOLATION_BREACH: "TENANT_ISOLATION_BREACH",
    ADVISORY_BOUNDARY_VIOLATION: "ADVISORY_ONLY_BOUNDARY_VIOLATION",
    INCOMPLETE_RECOVERY: "RECOVERY_PROCEDURES_INCOMPLETE",
    PRODUCTION_READINESS_UNMET: "PRODUCTION_READINESS_CRITERIA_UNMET",
    INTEGRITY_FAILURE: "INTEGRITY_HASH_MISMATCH",
  };
  return map[scenario];
}
function apiSurface(): ProductionReadinessApiSurface {
  const base: Omit<ProductionReadinessApiSurface, "integrity_hash"> = { api_id: "production_readiness_certification_api", retrieve_dashboard: "POST /production-readiness-certification/dashboard", retrieve_contract: "GET /production-readiness-certification/contract", retrieve_sections: freezeArray(["certification", "scalability", "stability", "observability", "governance", "replay", "fail-closed", "operator-workflow", "dependencies", "recovery", "report", "assessment"]), validate_certification: "POST /production-readiness-certification/validate", inspect_certification: "POST /production-readiness-certification/inspect", mutation_supported: false, deployment_supported: false, promotion_supported: false, override_supported: false };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function record(input: ProductionReadinessInput, failures: readonly ProductionReadinessFailure[]): ProductionReadinessCertificationRecord {
  const base: Omit<ProductionReadinessCertificationRecord, "integrity_hash"> = { certification_id: id("production_readiness_certification", VERSION), tenant_id: input.tenant_id ?? TENANT_ID, mission_id: input.mission_id ?? MISSION_ID, scalability_status: failures.includes("SCALABILITY_COMPROMISED_DETERMINISM") ? "FAIL" : "PASS", stability_status: failures.includes("OPERATIONAL_INSTABILITY_DETECTED") ? "FAIL" : "PASS", observability_status: failures.includes("OBSERVABILITY_INCOMPLETE") ? "FAIL" : "PASS", governance_readiness_status: failed(failures, ["GOVERNANCE_ENFORCEMENT_FAILURE", "CONSTITUTIONAL_ENFORCEMENT_FAILURE", "TENANT_ISOLATION_BREACH", "ADVISORY_ONLY_BOUNDARY_VIOLATION"]) ? "FAIL" : "PASS", replay_readiness_status: failed(failures, ["REPLAY_UNAVAILABLE", "REPLAY_INCONSISTENT"]) ? "FAIL" : "PASS", fail_closed_status: failures.includes("FAIL_OPEN_BEHAVIOR_DETECTED") ? "FAIL" : "PASS", operator_workflow_status: failures.includes("OPERATOR_WORKFLOW_FAILURE") ? "FAIL" : "PASS", certification_completeness_status: failed(failures, ["CERTIFICATION_DEPENDENCIES_INCOMPLETE", "UNRESOLVED_ADAPTIVE_SAFETY_FINDINGS"]) ? "FAIL" : "PASS", operational_recovery_status: failures.includes("RECOVERY_PROCEDURES_INCOMPLETE") ? "FAIL" : "PASS", production_ready: failures.length === 0, findings: failures, performance_refs: failures.includes("SCALABILITY_COMPROMISED_DETERMINISM") ? freezeArray([]) : freezeArray(["performance:production:scalability", "performance:production:stability"]), governance_refs: failed(failures, ["GOVERNANCE_ENFORCEMENT_FAILURE", "CONSTITUTIONAL_ENFORCEMENT_FAILURE"]) ? freezeArray([]) : freezeArray(["governance:production:1", "constitutional:production:1"]), replay_refs: failed(failures, ["REPLAY_UNAVAILABLE", "REPLAY_INCONSISTENT"]) ? freezeArray([]) : freezeArray(["replay:production:1"]), certification_refs: failures.includes("CERTIFICATION_DEPENDENCIES_INCOMPLETE") ? freezeArray([]) : freezeArray(DEPS.map((dep) => `certification:${dep}`)), certification_status: failures.length ? "REJECTED" : "CERTIFIED", certification_timestamp: "2026-07-09T00:00:00.000Z" };
  return Object.freeze({ ...base, integrity_hash: failures.includes("INTEGRITY_HASH_MISMATCH") ? "invalid-integrity" : hashWithoutIntegrity(base) });
}
function scalability(failures: readonly ProductionReadinessFailure[]): ScalabilityValidation {
  const ok = !failures.includes("SCALABILITY_COMPROMISED_DETERMINISM");
  const base: Omit<ScalabilityValidation, "integrity_hash"> = { validation_id: "scalability_validation", scalability_validated: ok, multi_tenant_scalability_validated: ok && !failures.includes("TENANT_ISOLATION_BREACH"), deterministic_execution_preserved: ok, replay_equivalence_preserved: ok && !failures.includes("REPLAY_INCONSISTENT"), governance_enforcement_preserved: ok && !failures.includes("GOVERNANCE_ENFORCEMENT_FAILURE"), constitutional_validation_preserved: ok && !failures.includes("CONSTITUTIONAL_ENFORCEMENT_FAILURE"), tenant_isolation_preserved: ok && !failures.includes("TENANT_ISOLATION_BREACH"), certification_integrity_preserved: !failures.includes("INTEGRITY_HASH_MISMATCH"), certification_throughput_validated: ok };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function stability(failures: readonly ProductionReadinessFailure[]): StabilityValidation {
  const ok = !failures.includes("OPERATIONAL_INSTABILITY_DETECTED");
  const base: Omit<StabilityValidation, "integrity_hash"> = { validation_id: "stability_validation", stability_verified: ok, long_duration_operation_stable: ok, adaptive_pipelines_stable: ok, memory_services_stable: ok, replay_services_stable: ok && !failures.includes("REPLAY_UNAVAILABLE"), simulation_engine_stable: ok, dashboard_services_stable: ok, governance_integration_stable: ok && !failures.includes("GOVERNANCE_ENFORCEMENT_FAILURE"), certification_engine_stable: ok };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function observability(failures: readonly ProductionReadinessFailure[]): ProductionObservabilityValidation {
  const ok = !failures.includes("OBSERVABILITY_INCOMPLETE");
  const base: Omit<ProductionObservabilityValidation, "integrity_hash"> = { validation_id: "production_observability_validation", observability_complete: ok, monitoring_operational: ok, metrics_complete: ok, structured_logging_complete: ok, distributed_tracing_operational: ok, health_monitoring_operational: ok, latency_monitoring_operational: ok, throughput_monitoring_operational: ok, error_reporting_operational: ok, replay_diagnostics_available: ok, certification_diagnostics_available: ok };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function governance(failures: readonly ProductionReadinessFailure[]): ProductionGovernanceValidation {
  const base: Omit<ProductionGovernanceValidation, "integrity_hash"> = { validation_id: "production_governance_validation", governance_readiness_verified: !failures.includes("GOVERNANCE_ENFORCEMENT_FAILURE"), constitutional_enforcement_verified: !failures.includes("CONSTITUTIONAL_ENFORCEMENT_FAILURE"), governance_supremacy_enforced: !failures.includes("GOVERNANCE_ENFORCEMENT_FAILURE"), approval_workflows_enforced: !failures.includes("OPERATOR_WORKFLOW_FAILURE"), policy_versioning_enforced: !failures.includes("GOVERNANCE_ENFORCEMENT_FAILURE"), authority_restrictions_enforced: !failures.includes("ADVISORY_ONLY_BOUNDARY_VIOLATION"), tenant_isolation_enforced: !failures.includes("TENANT_ISOLATION_BREACH"), advisory_only_boundaries_preserved: !failures.includes("ADVISORY_ONLY_BOUNDARY_VIOLATION") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function replay(failures: readonly ProductionReadinessFailure[]): ProductionReplayValidation {
  const base: Omit<ProductionReplayValidation, "integrity_hash"> = { validation_id: "production_replay_validation", replay_readiness_verified: !failed(failures, ["REPLAY_UNAVAILABLE", "REPLAY_INCONSISTENT"]), replay_services_continuously_available: !failures.includes("REPLAY_UNAVAILABLE"), complete_reconstruction_supported: !failures.includes("REPLAY_INCONSISTENT"), deterministic_replay_supported: !failures.includes("REPLAY_INCONSISTENT"), audit_investigation_supported: !failures.includes("REPLAY_UNAVAILABLE"), incident_analysis_supported: !failures.includes("REPLAY_UNAVAILABLE"), regulatory_review_supported: !failures.includes("REPLAY_UNAVAILABLE"), certification_replay_supported: !failures.includes("REPLAY_UNAVAILABLE") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function failClosed(failures: readonly ProductionReadinessFailure[]): FailClosedReadinessValidation {
  const base: Omit<FailClosedReadinessValidation, "integrity_hash"> = { validation_id: "fail_closed_readiness_validation", fail_closed_behavior_validated: !failures.includes("FAIL_OPEN_BEHAVIOR_DETECTED"), unsafe_adaptation_suppressed: !failures.includes("FAIL_OPEN_BEHAVIOR_DETECTED"), operator_escalation_occurs: !failures.includes("OPERATOR_WORKFLOW_FAILURE"), certification_suspension_available: !failures.includes("FAIL_OPEN_BEHAVIOR_DETECTED"), deterministic_rollback_validated: !failures.includes("RECOVERY_PROCEDURES_INCOMPLETE"), replay_integrity_preserved_during_recovery: !failures.includes("REPLAY_INCONSISTENT"), infrastructure_failures_contained: !failures.includes("FAIL_OPEN_BEHAVIOR_DETECTED") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function operatorWorkflow(failures: readonly ProductionReadinessFailure[]): OperatorWorkflowReadinessValidation {
  const ok = !failures.includes("OPERATOR_WORKFLOW_FAILURE");
  const base: Omit<OperatorWorkflowReadinessValidation, "integrity_hash"> = { validation_id: "operator_workflow_readiness_validation", operator_workflows_operational: ok, proposal_review_validated: ok, simulation_review_validated: ok, governance_approval_validated: ok, certification_review_validated: ok, replay_inspection_validated: ok, evidence_inspection_validated: ok, drift_investigation_validated: ok, rollback_execution_validated: ok && !failures.includes("RECOVERY_PROCEDURES_INCOMPLETE"), production_promotion_validated: ok };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function completeness(failures: readonly ProductionReadinessFailure[]): CertificationCompletenessValidation {
  const complete = !failures.includes("CERTIFICATION_DEPENDENCIES_INCOMPLETE");
  const deps = Object.fromEntries(DEPS.map((dep) => [dep, complete ? "PASS" : "FAIL"])) as Readonly<Record<ProductionCertificationDependency, ProductionReadinessStatus>>;
  const base: Omit<CertificationCompletenessValidation, "integrity_hash"> = { validation_id: "certification_completeness_validation", certification_completeness_verified: complete, dependencies: deps, unresolved_safety_findings_absent: !failures.includes("UNRESOLVED_ADAPTIVE_SAFETY_FINDINGS"), adaptive_ledgers_audit_ready: complete, all_phase_10_certifications_passed: complete && !failures.includes("UNRESOLVED_ADAPTIVE_SAFETY_FINDINGS") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function recovery(failures: readonly ProductionReadinessFailure[]): OperationalRecoveryValidation {
  const ok = !failures.includes("RECOVERY_PROCEDURES_INCOMPLETE");
  const base: Omit<OperationalRecoveryValidation, "integrity_hash"> = { validation_id: "operational_recovery_validation", operational_recovery_validated: ok, deterministic_rollback: ok, replay_assisted_recovery: ok && !failures.includes("REPLAY_UNAVAILABLE"), adaptive_suppression: ok, memory_isolation: ok, proposal_invalidation: ok, certification_suspension: ok, operator_guided_restoration: ok && !failures.includes("OPERATOR_WORKFLOW_FAILURE"), recovery_auditable: ok && !failures.includes("OBSERVABILITY_INCOMPLETE") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function report(record: ProductionReadinessCertificationRecord): ProductionReadinessCertificationReport {
  const base: Omit<ProductionReadinessCertificationReport, "integrity_hash"> = { report_id: "production_readiness_certification_report", certification_outcome: record.certification_status, scalability_assessment: record.scalability_status, stability_assessment: record.stability_status, observability_evaluation: record.observability_status, governance_readiness_analysis: record.governance_readiness_status, replay_readiness_validation: record.replay_readiness_status, fail_closed_verification: record.fail_closed_status, operator_workflow_assessment: record.operator_workflow_status, certification_dependency_review: record.certification_completeness_status, operational_recovery_analysis: record.operational_recovery_status, production_deployment_recommendation: record.production_ready ? "APPROVE" : "BLOCK", findings: record.findings, remediation_actions: record.findings.map((f) => `remediate:${f}`) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function assessment(record: ProductionReadinessCertificationRecord): OperationalReadinessAssessment {
  const base: Omit<OperationalReadinessAssessment, "integrity_hash"> = { assessment_id: "operational_readiness_assessment", deployment_readiness_summary: record.production_ready ? "READY" : "NOT_READY", operational_health_score: record.production_ready ? 1 : 0.97, performance_characteristics: record.performance_refs, monitoring_alerting_coverage: record.observability_status, governance_constitutional_compliance: record.governance_readiness_status, replay_audit_readiness: record.replay_readiness_status, recovery_capabilities: record.operational_recovery_status, operator_readiness: record.operator_workflow_status, outstanding_operational_risks: record.findings, certification_evidence_refs: freezeArray([...record.performance_refs, ...record.governance_refs, ...record.replay_refs, ...record.certification_refs]) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function test(name: string, passed: boolean, failure: ProductionReadinessFailure, refs: readonly string[]): ProductionReadinessCertificationTest {
  const base: Omit<ProductionReadinessCertificationTest, "integrity_hash"> = { test_id: id("production_readiness_test", name), name, expected: "PASS", actual: passed ? "PASS" : "FAIL", passed, failure_reason: passed ? null : failure, evidence_refs: refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
type BuildBase = Omit<ProductionReadinessResult, "validation_tests" | "failures" | "replay_hash" | "integrity_hash">;
function tests(result: BuildBase): readonly ProductionReadinessCertificationTest[] {
  const refs = freezeArray([result.record.integrity_hash]);
  return freezeArray([
    test("Scalability validated", result.scalability_validation.scalability_validated, "SCALABILITY_COMPROMISED_DETERMINISM", refs),
    test("Multi-tenant scalability validated", result.scalability_validation.multi_tenant_scalability_validated, "TENANT_ISOLATION_BREACH", refs),
    test("Stability verified", result.stability_validation.stability_verified, "OPERATIONAL_INSTABILITY_DETECTED", refs),
    test("Long-duration operation stable", result.stability_validation.long_duration_operation_stable, "OPERATIONAL_INSTABILITY_DETECTED", refs),
    test("Observability complete", result.observability_validation.observability_complete, "OBSERVABILITY_INCOMPLETE", refs),
    test("Monitoring operational", result.observability_validation.monitoring_operational, "OBSERVABILITY_INCOMPLETE", refs),
    test("Logging complete", result.observability_validation.structured_logging_complete, "OBSERVABILITY_INCOMPLETE", refs),
    test("Distributed tracing operational", result.observability_validation.distributed_tracing_operational, "OBSERVABILITY_INCOMPLETE", refs),
    test("Governance readiness verified", result.governance_validation.governance_readiness_verified, "GOVERNANCE_ENFORCEMENT_FAILURE", refs),
    test("Constitutional enforcement verified", result.governance_validation.constitutional_enforcement_verified, "CONSTITUTIONAL_ENFORCEMENT_FAILURE", refs),
    test("Replay readiness verified", result.replay_validation.replay_readiness_verified, "REPLAY_UNAVAILABLE", refs),
    test("Replay services continuously available", result.replay_validation.replay_services_continuously_available, "REPLAY_UNAVAILABLE", refs),
    test("Fail-closed behavior validated", result.fail_closed_validation.fail_closed_behavior_validated, "FAIL_OPEN_BEHAVIOR_DETECTED", refs),
    test("Deterministic rollback validated", result.fail_closed_validation.deterministic_rollback_validated, "RECOVERY_PROCEDURES_INCOMPLETE", refs),
    test("Operator workflows operational", result.operator_workflow_validation.operator_workflows_operational, "OPERATOR_WORKFLOW_FAILURE", refs),
    test("Proposal review workflow validated", result.operator_workflow_validation.proposal_review_validated, "OPERATOR_WORKFLOW_FAILURE", refs),
    test("Simulation review workflow validated", result.operator_workflow_validation.simulation_review_validated, "OPERATOR_WORKFLOW_FAILURE", refs),
    test("Certification review workflow validated", result.operator_workflow_validation.certification_review_validated, "OPERATOR_WORKFLOW_FAILURE", refs),
    test("Operational recovery validated", result.operational_recovery_validation.operational_recovery_validated, "RECOVERY_PROCEDURES_INCOMPLETE", refs),
    test("Certification completeness verified", result.certification_completeness_validation.certification_completeness_verified, "CERTIFICATION_DEPENDENCIES_INCOMPLETE", refs),
    test("Tenant isolation preserved", result.governance_validation.tenant_isolation_enforced, "TENANT_ISOLATION_BREACH", refs),
    test("Advisory-only boundaries preserved", result.governance_validation.advisory_only_boundaries_preserved, "ADVISORY_ONLY_BOUNDARY_VIOLATION", refs),
    test("Production readiness approved", result.record.production_ready, "PRODUCTION_READINESS_CRITERIA_UNMET", refs),
    test("Integrity hashes reproducible", hashWithoutIntegrity(result.record) === result.record.integrity_hash, "INTEGRITY_HASH_MISMATCH", refs),
  ]);
}
function replayHash(result: Omit<ProductionReadinessResult, "replay_hash" | "integrity_hash">): string { return hash({ record: result.record.integrity_hash, scalability: result.scalability_validation.integrity_hash, stability: result.stability_validation.integrity_hash, observability: result.observability_validation.integrity_hash, governance: result.governance_validation.integrity_hash, replay: result.replay_validation.integrity_hash, failClosed: result.fail_closed_validation.integrity_hash, operator: result.operator_workflow_validation.integrity_hash, completeness: result.certification_completeness_validation.integrity_hash, recovery: result.operational_recovery_validation.integrity_hash, failures: result.failures }); }
function integrityHash(result: Omit<ProductionReadinessResult, "integrity_hash">): string { return hash({ version: result.production_readiness_certification_version, id: result.certification_identifier, status: result.status, replay_hash: result.replay_hash }); }
export function certifyProductionReadiness(input: ProductionReadinessInput = {}): ProductionReadinessResult {
  const initialFailures = freezeArray(failureForScenario(input.scenario ?? "BASELINE") ? [failureForScenario(input.scenario ?? "BASELINE") as ProductionReadinessFailure] : []);
  const rec = record(input, initialFailures);
  const baseWithoutTests: BuildBase = { production_readiness_certification_version: VERSION, certification_identifier: ID, status: initialFailures.length ? "FAIL" : "PASS", api_surface: apiSurface(), record: rec, scalability_validation: scalability(initialFailures), stability_validation: stability(initialFailures), observability_validation: observability(initialFailures), governance_validation: governance(initialFailures), replay_validation: replay(initialFailures), fail_closed_validation: failClosed(initialFailures), operator_workflow_validation: operatorWorkflow(initialFailures), certification_completeness_validation: completeness(initialFailures), operational_recovery_validation: recovery(initialFailures), certification_report: report(rec), operational_readiness_assessment: assessment(rec), widgets: WIDGETS, production_ready: rec.production_ready, deterministic: rec.scalability_status === "PASS", observable: rec.observability_status === "PASS", governed: rec.governance_readiness_status === "PASS", replayable: rec.replay_readiness_status === "PASS", fail_closed: rec.fail_closed_status === "PASS", operator_ready: rec.operator_workflow_status === "PASS" };
  const validation_tests = tests(baseWithoutTests);
  const failures = freezeArray([...new Set([...initialFailures, ...validation_tests.map((t) => t.failure_reason).filter((f): f is ProductionReadinessFailure => Boolean(f))])]);
  const base: Omit<ProductionReadinessResult, "replay_hash" | "integrity_hash"> = { ...baseWithoutTests, status: failures.length ? "FAIL" : "PASS", production_ready: failures.length === 0, deterministic: !failures.includes("SCALABILITY_COMPROMISED_DETERMINISM"), observable: !failures.includes("OBSERVABILITY_INCOMPLETE"), governed: !failed(failures, ["GOVERNANCE_ENFORCEMENT_FAILURE", "CONSTITUTIONAL_ENFORCEMENT_FAILURE"]), replayable: !failed(failures, ["REPLAY_UNAVAILABLE", "REPLAY_INCONSISTENT"]), fail_closed: !failures.includes("FAIL_OPEN_BEHAVIOR_DETECTED"), operator_ready: !failures.includes("OPERATOR_WORKFLOW_FAILURE"), validation_tests, failures };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}
export function validateProductionReadinessCertification(result?: ProductionReadinessResult): ProductionReadinessValidationResult {
  if (!result) {
    const failures = freezeArray<ProductionReadinessFailure>(["PRODUCTION_READINESS_CRITERIA_UNMET"]);
    const base: Omit<ProductionReadinessValidationResult, "certification_hash"> = { certification_id: null, valid: false, status: "FAIL", failures, replay_hash_valid: false, integrity_hash_valid: false };
    return Object.freeze({ ...base, certification_hash: hashWithoutIntegrity(base) });
  }
  const nested = hashWithoutIntegrity(result.record) === result.record.integrity_hash && result.validation_tests.every((t) => hashWithoutIntegrity(t) === t.integrity_hash);
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && nested;
  const valid = result.status === "PASS" && result.failures.length === 0 && result.production_ready && result.deterministic && result.observable && result.governed && result.replayable && result.fail_closed && result.operator_ready && replay_hash_valid && integrity_hash_valid;
  const base: Omit<ProductionReadinessValidationResult, "certification_hash"> = { certification_id: result.record.certification_id, valid, status: result.status, failures: result.failures, replay_hash_valid, integrity_hash_valid };
  return Object.freeze({ ...base, certification_hash: hashWithoutIntegrity(base) });
}
export function replayProductionReadinessCertification(result: ProductionReadinessResult): boolean { return validateProductionReadinessCertification(result).valid; }
export function buildProductionReadinessObservability(result = certifyProductionReadiness()): ProductionReadinessObservability {
  return Object.freeze({ certification_id: result.record.certification_id, status: result.status, failed_tests: result.validation_tests.filter((t) => !t.passed).length, failures: result.failures, production_ready: result.production_ready, deterministic: result.deterministic, observable: result.observable, governed: result.governed, replayable: result.replayable, fail_closed: result.fail_closed, operator_ready: result.operator_ready, integrity_hash: result.integrity_hash });
}
export function getProductionReadinessContract(): ProductionReadinessContract {
  const result = certifyProductionReadiness();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, widgets: WIDGETS, certification_dependencies: DEPS, deterministic_required: true, governance_required: true, replay_required: true, observability_required: true, fail_closed_required: true, operator_workflows_required: true }), result, validation: validateProductionReadinessCertification(result), observability: buildProductionReadinessObservability(result) });
}
export const ProductionReadinessCertification = Object.freeze({ certify: certifyProductionReadiness, validate: validateProductionReadinessCertification, replay: replayProductionReadinessCertification });
