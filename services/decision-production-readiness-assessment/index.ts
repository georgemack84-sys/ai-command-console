import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runSecurityBoundaryCertification } from "@/services/decision-security-isolation-boundary-certification";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { SecurityBoundaryCertificationResult } from "@/types/decision-security-isolation-boundary-certification";
import type {
  DisasterRecoveryReadinessReport,
  ExplainabilityReadinessReport,
  MonitoringReadinessReport,
  OperationalReadinessReport,
  PerformanceReadinessReport,
  ProductionReadinessCheck,
  ProductionReadinessChecklist,
  ProductionReadinessDomain,
  ProductionReadinessEvidencePackage,
  ProductionReadinessFailure,
  ProductionReadinessFoundation,
  ProductionReadinessInput,
  ProductionReadinessLedgerEntry,
  ProductionReadinessResult,
  ProductionReadinessScorecard,
  ProductionReadinessState,
  ProductionReadinessValidation,
  ReliabilityReadinessReport,
  ScalabilityReadinessReport,
} from "@/types/decision-production-readiness-assessment";

const CERTIFICATION_VERSION = "decision-production-readiness-assessment/v1" as const;

export const PRODUCTION_READINESS_DOMAINS: readonly ProductionReadinessDomain[] = Object.freeze(["PERFORMANCE", "SCALABILITY", "RELIABILITY", "EXPLAINABILITY", "REPLAY", "GOVERNANCE", "OPERATIONS", "MONITORING", "DISASTER_RECOVERY"]);
export const PRODUCTION_READINESS_CHECKS: readonly ProductionReadinessCheck[] = Object.freeze(["PERFORMANCE_OBJECTIVES", "ORCHESTRATION_LATENCY", "SCALABILITY_DETERMINISM", "CONCURRENT_WORKLOADS", "RUNTIME_STABILITY", "RECOMMENDATION_EXPLAINABILITY", "REPLAY_RECONSTRUCTION", "GOVERNANCE_ENFORCEMENT", "TENANT_ISOLATION", "ADVISORY_ONLY", "OPERATIONAL_PROCEDURES", "MONITORING_COVERAGE", "DISASTER_RECOVERY", "INTEGRITY_VERIFICATION"]);

type Scenario = NonNullable<ProductionReadinessInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function state(pass: boolean): ProductionReadinessState {
  return pass ? "PASS" : "FAIL";
}

function ctx(source: SecurityBoundaryCertificationResult) {
  return {
    tenant_id: source.security_report.tenant_id,
    mission_id: source.security_report.mission_id,
    replay_ref: source.replay_hash,
  };
}

function visibleToRole(source: SecurityBoundaryCertificationResult, role: VisibilityRole): boolean {
  return source.observability_certification.ledger_certification.operator_workflow_certification.intelligence_certification.governance_certification.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function buildPerformance(source: SecurityBoundaryCertificationResult, scenario: Scenario): PerformanceReadinessReport {
  const c = ctx(source);
  const base: Omit<PerformanceReadinessReport, "integrity_hash"> = {
    report_id: "production_performance_readiness_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    orchestration_latency_ms: scenario === "LATENCY_UNACCEPTABLE" ? 1600 : 240,
    context_construction_ms: scenario === "PERFORMANCE_MISS" ? 900 : 120,
    graph_generation_ms: scenario === "PERFORMANCE_MISS" ? 850 : 110,
    arbitration_ms: scenario === "PERFORMANCE_MISS" ? 760 : 90,
    priority_scoring_ms: scenario === "PERFORMANCE_MISS" ? 700 : 80,
    package_generation_ms: scenario === "PERFORMANCE_MISS" ? 1000 : 140,
    replay_execution_ms: scenario === "REPLAY_NOT_READY" ? 1500 : 180,
    dashboard_response_ms: scenario === "PERFORMANCE_MISS" ? 1200 : 95,
    throughput_per_minute: scenario === "PERFORMANCE_MISS" ? 8 : 120,
    resource_utilization_percent: scenario === "PERFORMANCE_MISS" ? 96 : 62,
    validation_state: "PASS",
  };
  const normalized = { ...base, validation_state: state(base.orchestration_latency_ms <= 500 && base.context_construction_ms <= 300 && base.graph_generation_ms <= 300 && base.arbitration_ms <= 300 && base.priority_scoring_ms <= 300 && base.package_generation_ms <= 400 && base.replay_execution_ms <= 500 && base.dashboard_response_ms <= 300 && base.throughput_per_minute >= 60 && base.resource_utilization_percent <= 80) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildScalability(source: SecurityBoundaryCertificationResult, scenario: Scenario): ScalabilityReadinessReport {
  const c = ctx(source);
  const base: Omit<ScalabilityReadinessReport, "integrity_hash"> = {
    report_id: "production_scalability_readiness_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    concurrent_orchestrations_supported: scenario === "CONCURRENT_LIMIT" ? 3 : 50,
    large_workload_supported: scenario !== "SCALABILITY_NONDETERMINISM",
    evidence_volume_supported: scenario !== "SCALABILITY_NONDETERMINISM",
    multi_mission_supported: scenario !== "CONCURRENT_LIMIT",
    multi_tenant_supported: scenario !== "SCALABILITY_NONDETERMINISM",
    dashboard_scalability_verified: scenario !== "SCALABILITY_NONDETERMINISM",
    replay_scalability_verified: scenario !== "SCALABILITY_NONDETERMINISM",
    ledger_growth_handling_verified: scenario !== "SCALABILITY_NONDETERMINISM",
    deterministic_under_load: scenario !== "SCALABILITY_NONDETERMINISM",
    validation_state: "PASS",
  };
  const normalized = { ...base, validation_state: state(base.concurrent_orchestrations_supported >= 10 && base.large_workload_supported && base.evidence_volume_supported && base.multi_mission_supported && base.multi_tenant_supported && base.dashboard_scalability_verified && base.replay_scalability_verified && base.ledger_growth_handling_verified && base.deterministic_under_load) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildReliability(source: SecurityBoundaryCertificationResult, scenario: Scenario): ReliabilityReadinessReport {
  const c = ctx(source);
  const base: Omit<ReliabilityReadinessReport, "integrity_hash"> = {
    report_id: "production_reliability_readiness_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    runtime_stability_verified: scenario !== "RUNTIME_INSTABILITY",
    error_recovery_verified: scenario !== "RELIABILITY_FAILURE",
    service_continuity_verified: scenario !== "RELIABILITY_FAILURE",
    workflow_completion_verified: scenario !== "RELIABILITY_FAILURE",
    replay_reliability_verified: scenario !== "REPLAY_NOT_READY" && scenario !== "REPLAY_INCONSISTENCY",
    ledger_reliability_verified: scenario !== "RELIABILITY_FAILURE",
    dashboard_availability_verified: scenario !== "MONITORING_GAP",
    operational_consistency_verified: scenario !== "RUNTIME_INSTABILITY" && scenario !== "RELIABILITY_FAILURE",
    validation_state: "PASS",
  };
  const normalized = { ...base, validation_state: state(base.runtime_stability_verified && base.error_recovery_verified && base.service_continuity_verified && base.workflow_completion_verified && base.replay_reliability_verified && base.ledger_reliability_verified && base.dashboard_availability_verified && base.operational_consistency_verified) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildExplainability(source: SecurityBoundaryCertificationResult, scenario: Scenario): ExplainabilityReadinessReport {
  const c = ctx(source);
  const missing = scenario === "MISSING_EXPLANATIONS";
  const base: Omit<ExplainabilityReadinessReport, "integrity_hash"> = {
    report_id: "production_explainability_readiness_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    recommendation_rationale_complete: !missing,
    evidence_traceability_complete: !missing,
    dependency_explanations_complete: !missing,
    conflict_explanations_complete: !missing,
    priority_explanations_complete: !missing,
    governance_explanations_complete: !missing,
    constitutional_explanations_complete: !missing,
    operator_summaries_complete: !missing,
    validation_state: "PASS",
  };
  const normalized = { ...base, validation_state: state(base.recommendation_rationale_complete && base.evidence_traceability_complete && base.dependency_explanations_complete && base.conflict_explanations_complete && base.priority_explanations_complete && base.governance_explanations_complete && base.constitutional_explanations_complete && base.operator_summaries_complete) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildMonitoring(source: SecurityBoundaryCertificationResult, scenario: Scenario): MonitoringReadinessReport {
  const c = ctx(source);
  const base: Omit<MonitoringReadinessReport, "integrity_hash"> = {
    report_id: "production_monitoring_readiness_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    health_monitoring_complete: scenario !== "MONITORING_GAP",
    dashboard_monitoring_complete: scenario !== "MONITORING_GAP",
    alerting_operational: scenario !== "MONITORING_GAP",
    logging_integrity_verified: scenario !== "MONITORING_GAP",
    metrics_collection_complete: scenario !== "MONITORING_GAP",
    replay_monitoring_complete: scenario !== "MONITORING_GAP",
    governance_monitoring_complete: scenario !== "MONITORING_GAP",
    performance_monitoring_complete: scenario !== "MONITORING_GAP",
    validation_state: "PASS",
  };
  const normalized = { ...base, validation_state: state(base.health_monitoring_complete && base.dashboard_monitoring_complete && base.alerting_operational && base.logging_integrity_verified && base.metrics_collection_complete && base.replay_monitoring_complete && base.governance_monitoring_complete && base.performance_monitoring_complete) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildRecovery(source: SecurityBoundaryCertificationResult, scenario: Scenario): DisasterRecoveryReadinessReport {
  const c = ctx(source);
  const base: Omit<DisasterRecoveryReadinessReport, "integrity_hash"> = {
    report_id: "production_disaster_recovery_readiness_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    backup_validation_complete: scenario !== "BACKUP_FAILURE" && scenario !== "DR_NOT_VALIDATED",
    recovery_procedures_tested: scenario !== "RECOVERY_FAILURE" && scenario !== "DR_NOT_VALIDATED",
    ledger_recovery_verified: scenario !== "RECOVERY_FAILURE" && scenario !== "DR_NOT_VALIDATED",
    replay_recovery_verified: scenario !== "RECOVERY_FAILURE" && scenario !== "DR_NOT_VALIDATED",
    configuration_recovery_verified: scenario !== "RECOVERY_FAILURE" && scenario !== "DR_NOT_VALIDATED",
    certification_recovery_verified: scenario !== "RECOVERY_FAILURE" && scenario !== "DR_NOT_VALIDATED",
    recovery_documentation_complete: scenario !== "DR_NOT_VALIDATED",
    recovery_replay_reproducible: scenario !== "RECOVERY_FAILURE" && scenario !== "REPLAY_INCONSISTENCY" && scenario !== "DR_NOT_VALIDATED",
    validation_state: "PASS",
  };
  const normalized = { ...base, validation_state: state(base.backup_validation_complete && base.recovery_procedures_tested && base.ledger_recovery_verified && base.replay_recovery_verified && base.configuration_recovery_verified && base.certification_recovery_verified && base.recovery_documentation_complete && base.recovery_replay_reproducible) };
  const built = Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.report_id }) });
  return built;
}

function buildChecklist(source: SecurityBoundaryCertificationResult, scenario: Scenario): ProductionReadinessChecklist {
  const c = ctx(source);
  const base: Omit<ProductionReadinessChecklist, "integrity_hash"> = {
    checklist_id: "production_readiness_checklist",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    all_phase_9_certifications_complete: source.validation.validation_status === "VALID" && scenario !== "SECURITY_INVALID",
    deterministic_orchestration_verified: source.deterministic,
    replay_certification_passed: source.replayable && scenario !== "REPLAY_NOT_READY",
    governance_certification_passed: source.validation.governance_boundaries_enforced && scenario !== "GOVERNANCE_INCOMPLETE",
    decision_intelligence_certification_passed: source.security_report.certification_decision === "PASS",
    operator_workflow_certification_passed: source.validation.authorization_valid,
    ledger_certification_passed: source.validation.integrity_verified,
    observability_certification_passed: source.validation.observability_certification_valid,
    security_certification_passed: source.security_report.certification_decision === "PASS",
    production_documentation_complete: scenario !== "MISSING_PROCEDURES",
    operational_procedures_approved: scenario !== "MISSING_PROCEDURES",
    hidden_dependencies_absent: scenario !== "HIDDEN_DEPENDENCY",
    validation_state: "PASS",
  };
  const normalized = { ...base, validation_state: state(base.all_phase_9_certifications_complete && base.deterministic_orchestration_verified && base.replay_certification_passed && base.governance_certification_passed && base.decision_intelligence_certification_passed && base.operator_workflow_certification_passed && base.ledger_certification_passed && base.observability_certification_passed && base.security_certification_passed && base.production_documentation_complete && base.operational_procedures_approved && base.hidden_dependencies_absent) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildEvidence(source: SecurityBoundaryCertificationResult, checklist: ProductionReadinessChecklist, performance: PerformanceReadinessReport, scalability: ScalabilityReadinessReport, reliability: ReliabilityReadinessReport, explainability: ExplainabilityReadinessReport, monitoring: MonitoringReadinessReport, recovery: DisasterRecoveryReadinessReport, scenario: Scenario): ProductionReadinessEvidencePackage {
  const c = ctx(source);
  const base: Omit<ProductionReadinessEvidencePackage, "integrity_hash"> = {
    evidence_package_id: "production_readiness_evidence_package",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    performance_evidence_refs: scenario === "PERFORMANCE_MISS" || scenario === "LATENCY_UNACCEPTABLE" ? freezeArray([]) : freezeArray([performance.report_id, "benchmark:latency", "benchmark:throughput"]),
    scalability_evidence_refs: scenario === "SCALABILITY_NONDETERMINISM" || scenario === "CONCURRENT_LIMIT" ? freezeArray([]) : freezeArray([scalability.report_id, "load:concurrency", "capacity:growth"]),
    reliability_evidence_refs: scenario === "RUNTIME_INSTABILITY" || scenario === "RELIABILITY_FAILURE" ? freezeArray([]) : freezeArray([reliability.report_id, "recovery:service-continuity"]),
    explainability_evidence_refs: scenario === "MISSING_EXPLANATIONS" ? freezeArray([]) : freezeArray([explainability.report_id, "explainability:rationale"]),
    replay_evidence_refs: scenario === "REPLAY_NOT_READY" || scenario === "REPLAY_INCONSISTENCY" ? freezeArray([]) : freezeArray([source.replay_hash, source.security_replay_report.report_id]),
    monitoring_evidence_refs: scenario === "MONITORING_GAP" ? freezeArray([]) : freezeArray([monitoring.report_id, "monitoring:alerts"]),
    recovery_evidence_refs: scenario === "DR_NOT_VALIDATED" || scenario === "BACKUP_FAILURE" || scenario === "RECOVERY_FAILURE" ? freezeArray([]) : freezeArray([recovery.report_id, "recovery:tested"]),
    governance_evidence_refs: scenario === "GOVERNANCE_INCOMPLETE" || scenario === "CONSTITUTIONAL_INCOMPLETE" || scenario === "AUTHORITY_FAILURE" || scenario === "TENANT_ISOLATION_FAILURE" || scenario === "ADVISORY_ONLY_FAILURE" ? freezeArray([]) : freezeArray([source.security_report.report_id, ...source.security_report.failure_analysis]),
    operational_evidence_refs: scenario === "MISSING_PROCEDURES" || scenario === "HIDDEN_DEPENDENCY" ? freezeArray([]) : freezeArray([checklist.checklist_id, source.evidence_package.evidence_package_id]),
    complete: !["PERFORMANCE_MISS", "LATENCY_UNACCEPTABLE", "SCALABILITY_NONDETERMINISM", "CONCURRENT_LIMIT", "RUNTIME_INSTABILITY", "RELIABILITY_FAILURE", "MISSING_EXPLANATIONS", "REPLAY_NOT_READY", "REPLAY_INCONSISTENCY", "GOVERNANCE_INCOMPLETE", "CONSTITUTIONAL_INCOMPLETE", "AUTHORITY_FAILURE", "TENANT_ISOLATION_FAILURE", "ADVISORY_ONLY_FAILURE", "MONITORING_GAP", "MISSING_PROCEDURES", "DR_NOT_VALIDATED", "BACKUP_FAILURE", "RECOVERY_FAILURE", "HIDDEN_DEPENDENCY"].includes(scenario),
    immutable: scenario !== "FAIL_OPEN",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(input: {
  security: SecurityBoundaryCertificationResult;
  checklist: ProductionReadinessChecklist;
  performance: PerformanceReadinessReport;
  scalability: ScalabilityReadinessReport;
  reliability: ReliabilityReadinessReport;
  explainability: ExplainabilityReadinessReport;
  monitoring: MonitoringReadinessReport;
  recovery: DisasterRecoveryReadinessReport;
  evidence: ProductionReadinessEvidencePackage;
  ledger: readonly ProductionReadinessLedgerEntry[];
  role: VisibilityRole;
  scenario: Scenario;
}): readonly ProductionReadinessFailure[] {
  const failures: ProductionReadinessFailure[] = [];
  if (input.security.validation.validation_status !== "VALID" || input.security.security_report.certification_decision !== "PASS") failures.push("SECURITY_CERTIFICATION_INVALID");
  if (input.performance.validation_state !== "PASS" || input.performance.throughput_per_minute < 60 || input.performance.resource_utilization_percent > 80) failures.push("PERFORMANCE_OBJECTIVES_NOT_ACHIEVED");
  if (input.performance.orchestration_latency_ms > 500) failures.push("ORCHESTRATION_LATENCY_UNACCEPTABLE");
  if (!input.scalability.deterministic_under_load) failures.push("SCALABILITY_NONDETERMINISM");
  if (input.scalability.concurrent_orchestrations_supported < 10 || !input.scalability.multi_mission_supported) failures.push("CONCURRENT_WORKLOAD_LIMITATION");
  if (!input.reliability.runtime_stability_verified) failures.push("RUNTIME_INSTABILITY");
  if (input.reliability.validation_state !== "PASS") failures.push("RELIABILITY_FAILURE");
  if (input.explainability.validation_state !== "PASS") failures.push("MISSING_RECOMMENDATION_EXPLANATIONS");
  if (!input.reliability.replay_reliability_verified || !input.recovery.replay_recovery_verified || input.scenario === "REPLAY_NOT_READY") failures.push("REPLAY_NOT_PRODUCTION_READY");
  if (!input.recovery.recovery_replay_reproducible || input.scenario === "REPLAY_INCONSISTENCY") failures.push("REPLAY_INCONSISTENCY");
  if (!input.checklist.governance_certification_passed || input.scenario === "GOVERNANCE_INCOMPLETE") failures.push("GOVERNANCE_ENFORCEMENT_INCOMPLETE");
  if (input.scenario === "CONSTITUTIONAL_INCOMPLETE") failures.push("CONSTITUTIONAL_ENFORCEMENT_INCOMPLETE");
  if (input.scenario === "AUTHORITY_FAILURE") failures.push("AUTHORITY_VALIDATION_FAILURE");
  if (input.scenario === "TENANT_ISOLATION_FAILURE") failures.push("TENANT_ISOLATION_FAILURE");
  if (input.scenario === "ADVISORY_ONLY_FAILURE") failures.push("ADVISORY_ONLY_FAILURE");
  if (input.monitoring.validation_state !== "PASS") failures.push("MONITORING_GAPS");
  if (!input.checklist.production_documentation_complete || !input.checklist.operational_procedures_approved) failures.push("MISSING_OPERATIONAL_PROCEDURES");
  if (input.recovery.validation_state !== "PASS" || input.scenario === "DR_NOT_VALIDATED") failures.push("DISASTER_RECOVERY_NOT_VALIDATED");
  if (!input.recovery.backup_validation_complete) failures.push("BACKUP_FAILURE");
  if (!input.recovery.recovery_procedures_tested || !input.recovery.ledger_recovery_verified || !input.recovery.configuration_recovery_verified || !input.recovery.certification_recovery_verified) failures.push("RECOVERY_FAILURE");
  if (
    hashWithoutIntegrity(input.checklist) !== input.checklist.integrity_hash
    || hashWithoutIntegrity(input.performance) !== input.performance.integrity_hash
    || hashWithoutIntegrity(input.scalability) !== input.scalability.integrity_hash
    || hashWithoutIntegrity(input.reliability) !== input.reliability.integrity_hash
    || hashWithoutIntegrity(input.explainability) !== input.explainability.integrity_hash
    || hashWithoutIntegrity(input.monitoring) !== input.monitoring.integrity_hash
    || hashWithoutIntegrity(input.recovery) !== input.recovery.integrity_hash
    || hashWithoutIntegrity(input.evidence) !== input.evidence.integrity_hash
    || input.ledger.some((entry) => hashWithoutIntegrity(entry) !== entry.integrity_hash)
  ) failures.push("INTEGRITY_VERIFICATION_FAILURE");
  if (!input.checklist.hidden_dependencies_absent || !input.evidence.complete) failures.push("HIDDEN_OPERATIONAL_DEPENDENCY");
  if (!input.evidence.immutable || input.ledger.some((entry) => !entry.append_only || entry.deleted)) failures.push("FAIL_OPEN_OPERATIONAL_BEHAVIOR");
  if (!visibleToRole(input.security, input.role)) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "EXECUTION_AUTHORITY") failures.push("EXECUTION_AUTHORITY_GRANTED");
  return freezeArray([...new Set(failures)]);
}

function buildScorecard(source: SecurityBoundaryCertificationResult, performance: PerformanceReadinessReport, scalability: ScalabilityReadinessReport, reliability: ReliabilityReadinessReport, explainability: ExplainabilityReadinessReport, monitoring: MonitoringReadinessReport, recovery: DisasterRecoveryReadinessReport, checklist: ProductionReadinessChecklist, failures: readonly ProductionReadinessFailure[]): ProductionReadinessScorecard {
  const c = ctx(source);
  const passCount = [performance.validation_state, scalability.validation_state, reliability.validation_state, explainability.validation_state, source.security_replay_report.validation_state, source.security_report.governance_boundary_assessment, checklist.validation_state, monitoring.validation_state, recovery.validation_state].filter((value) => value === "PASS").length;
  const base: Omit<ProductionReadinessScorecard, "integrity_hash"> = {
    scorecard_id: "production_readiness_scorecard",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    performance_readiness: performance.validation_state,
    scalability_readiness: scalability.validation_state,
    reliability_readiness: reliability.validation_state,
    explainability_readiness: explainability.validation_state,
    replay_readiness: source.security_replay_report.validation_state === "PASS" && recovery.recovery_replay_reproducible ? "PASS" : "FAIL",
    governance_readiness: source.security_report.governance_boundary_assessment,
    operational_readiness: checklist.validation_state,
    monitoring_readiness: monitoring.validation_state,
    disaster_recovery_readiness: recovery.validation_state,
    overall_score: Math.round((passCount / 9) * 100),
    outstanding_risks: failures,
    final_recommendation: failures.length ? "BLOCK_PRODUCTION" : "APPROVE_CONTROLLED_PRODUCTION",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildOperationalReport(source: SecurityBoundaryCertificationResult, scorecard: ProductionReadinessScorecard, failures: readonly ProductionReadinessFailure[]): OperationalReadinessReport {
  const c = ctx(source);
  const decision = failures.length ? "FAIL" : "PASS";
  const base: Omit<OperationalReadinessReport, "integrity_hash"> = {
    report_id: "operational_readiness_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    executive_summary: decision === "PASS" ? "Decision Orchestrator is approved for controlled production deployment with deterministic, observable, replayable, governed, secure, and recoverable operations." : "Production readiness is blocked by operational, monitoring, recovery, governance, replay, integrity, or certification gaps.",
    certification_scope: PRODUCTION_READINESS_DOMAINS,
    certified_checks: PRODUCTION_READINESS_CHECKS,
    performance_assessment: scorecard.performance_readiness,
    scalability_assessment: scorecard.scalability_readiness,
    reliability_assessment: scorecard.reliability_readiness,
    explainability_assessment: scorecard.explainability_readiness,
    replay_readiness_assessment: scorecard.replay_readiness,
    governance_readiness_assessment: scorecard.governance_readiness,
    operational_procedures_assessment: scorecard.operational_readiness,
    monitoring_assessment: scorecard.monitoring_readiness,
    disaster_recovery_assessment: scorecard.disaster_recovery_readiness,
    integrity_verification: failures.includes("INTEGRITY_VERIFICATION_FAILURE") ? "FAIL" : "PASS",
    risk_assessment: failures,
    certification_decision: decision,
    production_approval_recommendation: failures.length ? "BLOCK_PRODUCTION" : "APPROVE_CONTROLLED_PRODUCTION",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(source: SecurityBoundaryCertificationResult, evidence: ProductionReadinessEvidencePackage, report: OperationalReadinessReport, scenario: Scenario): readonly ProductionReadinessLedgerEntry[] {
  const c = ctx(source);
  const events: Omit<ProductionReadinessLedgerEntry, "integrity_hash">[] = [
    { ledger_entry_id: "production_readiness_ledger_001", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "PERFORMANCE_VALIDATED", scope_ref: "performance", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:50.000Z", sequence_number: 1, append_only: true, deleted: false },
    { ledger_entry_id: "production_readiness_ledger_002", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "SCALABILITY_VALIDATED", scope_ref: "scalability", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:51.000Z", sequence_number: 2, append_only: true, deleted: false },
    { ledger_entry_id: "production_readiness_ledger_003", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "RELIABILITY_VALIDATED", scope_ref: "reliability", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:52.000Z", sequence_number: 3, append_only: true, deleted: false },
    { ledger_entry_id: "production_readiness_ledger_004", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "MONITORING_VALIDATED", scope_ref: "monitoring", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:53.000Z", sequence_number: 4, append_only: true, deleted: false },
    { ledger_entry_id: "production_readiness_ledger_005", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "RECOVERY_VALIDATED", scope_ref: "disaster_recovery", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:54.000Z", sequence_number: 5, append_only: true, deleted: false },
    { ledger_entry_id: "production_readiness_ledger_006", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: report.certification_decision === "PASS" ? "READINESS_CERTIFIED" : "READINESS_BLOCKED", scope_ref: report.report_id, evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:55.000Z", sequence_number: 6, append_only: (scenario === "FAIL_OPEN" ? false : true) as true, deleted: false },
  ];
  return freezeArray(events.map((event) => Object.freeze({ ...event, integrity_hash: hashWithoutIntegrity(event) })));
}

function buildValidation(failures: readonly ProductionReadinessFailure[]): ProductionReadinessValidation {
  const has = (failure: ProductionReadinessFailure) => failures.includes(failure);
  const base: Omit<ProductionReadinessValidation, "integrity_hash"> = {
    validation_id: "production_readiness_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    security_certification_valid: !has("SECURITY_CERTIFICATION_INVALID"),
    performance_ready: !has("PERFORMANCE_OBJECTIVES_NOT_ACHIEVED") && !has("ORCHESTRATION_LATENCY_UNACCEPTABLE"),
    scalability_ready: !has("SCALABILITY_NONDETERMINISM") && !has("CONCURRENT_WORKLOAD_LIMITATION"),
    reliability_ready: !has("RUNTIME_INSTABILITY") && !has("RELIABILITY_FAILURE"),
    explainability_ready: !has("MISSING_RECOMMENDATION_EXPLANATIONS"),
    replay_ready: !has("REPLAY_NOT_PRODUCTION_READY") && !has("REPLAY_INCONSISTENCY"),
    governance_ready: !has("GOVERNANCE_ENFORCEMENT_INCOMPLETE") && !has("CONSTITUTIONAL_ENFORCEMENT_INCOMPLETE") && !has("AUTHORITY_VALIDATION_FAILURE") && !has("TENANT_ISOLATION_FAILURE") && !has("ADVISORY_ONLY_FAILURE"),
    operational_ready: !has("MISSING_OPERATIONAL_PROCEDURES") && !has("HIDDEN_OPERATIONAL_DEPENDENCY"),
    monitoring_ready: !has("MONITORING_GAPS"),
    disaster_recovery_ready: !has("DISASTER_RECOVERY_NOT_VALIDATED") && !has("BACKUP_FAILURE") && !has("RECOVERY_FAILURE"),
    backup_validated: !has("BACKUP_FAILURE"),
    recovery_validated: !has("RECOVERY_FAILURE"),
    integrity_verified: !has("INTEGRITY_VERIFICATION_FAILURE"),
    hidden_dependencies_absent: !has("HIDDEN_OPERATIONAL_DEPENDENCY"),
    fail_closed: !has("FAIL_OPEN_OPERATIONAL_BEHAVIOR"),
    authorization_valid: !has("AUTHORIZATION_FAILURE"),
    execution_authority_absent: !has("EXECUTION_AUTHORITY_GRANTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<ProductionReadinessResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    checklist: result.checklist,
    performance: result.performance_report,
    scalability: result.scalability_report,
    reliability: result.reliability_report,
    explainability: result.explainability_report,
    monitoring: result.monitoring_report,
    recovery: result.disaster_recovery_report,
    evidence: result.evidence_package,
    scorecard: result.scorecard,
    report: result.operational_report,
    ledger: result.readiness_ledger,
    validation: result.validation,
  });
}

export function runProductionReadinessAssessment(input: ProductionReadinessInput = {}): ProductionReadinessResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const security_certification = input.security_certification ?? runSecurityBoundaryCertification({ scenario: scenario === "SECURITY_INVALID" ? "TENANT_LEAKAGE" : "BASELINE" });
  const checklist = buildChecklist(security_certification, scenario);
  const performance_report = buildPerformance(security_certification, scenario);
  const scalability_report = buildScalability(security_certification, scenario);
  const reliability_report = buildReliability(security_certification, scenario);
  const explainability_report = buildExplainability(security_certification, scenario);
  const monitoring_report = buildMonitoring(security_certification, scenario);
  const disaster_recovery_report = buildRecovery(security_certification, scenario);
  const evidence_package = buildEvidence(security_certification, checklist, performance_report, scalability_report, reliability_report, explainability_report, monitoring_report, disaster_recovery_report, scenario);
  const preFailures = collectFailures({ security: security_certification, checklist, performance: performance_report, scalability: scalability_report, reliability: reliability_report, explainability: explainability_report, monitoring: monitoring_report, recovery: disaster_recovery_report, evidence: evidence_package, ledger: [], role, scenario });
  const scorecard = buildScorecard(security_certification, performance_report, scalability_report, reliability_report, explainability_report, monitoring_report, disaster_recovery_report, checklist, preFailures);
  const operational_report = buildOperationalReport(security_certification, scorecard, preFailures);
  const readiness_ledger = buildLedger(security_certification, evidence_package, operational_report, scenario);
  const failures = collectFailures({ security: security_certification, checklist, performance: performance_report, scalability: scalability_report, reliability: reliability_report, explainability: explainability_report, monitoring: monitoring_report, recovery: disaster_recovery_report, evidence: evidence_package, ledger: readiness_ledger, role, scenario });
  const validation = buildValidation(failures);
  const approved_for_controlled_production = failures.length === 0;
  const base: Omit<ProductionReadinessResult, "integrity_hash" | "replay_hash"> = {
    certification_version: CERTIFICATION_VERSION,
    security_certification,
    checklist,
    performance_report,
    scalability_report,
    reliability_report,
    explainability_report,
    monitoring_report,
    disaster_recovery_report,
    evidence_package,
    scorecard,
    operational_report,
    readiness_ledger,
    validation,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    approved_for_controlled_production,
    mutates_production_state: false,
    execution_authority_granted: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayProductionReadinessAssessment(result: ProductionReadinessResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeProductionReadinessHash(record: Omit<ProductionReadinessChecklist, "integrity_hash"> | ProductionReadinessChecklist): string {
  return hashWithoutIntegrity(record);
}

export function getProductionReadinessFoundation(): ProductionReadinessFoundation {
  return Object.freeze({
    certification_version: CERTIFICATION_VERSION,
    domains: PRODUCTION_READINESS_DOMAINS,
    checks: PRODUCTION_READINESS_CHECKS,
    result: runProductionReadinessAssessment(),
  });
}

export const ProductionReadinessAssessment = Object.freeze({
  run: runProductionReadinessAssessment,
  replay: replayProductionReadinessAssessment,
});
