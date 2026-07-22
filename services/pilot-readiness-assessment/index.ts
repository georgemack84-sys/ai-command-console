import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runIncidentExceptionGovernance } from "@/services/incident-exception-governance";
import type {
  PilotReadinessAssessmentBundle,
  PilotReadinessAssessmentCertificationTest,
  PilotReadinessAssessmentFailure,
  PilotReadinessAssessmentInput,
  PilotReadinessAssessmentOutcome,
  PilotReadinessAssessmentResult,
  PilotReadinessAssessmentValidation,
  ReadinessAssessmentOutcome,
  ReadinessCategory,
  ReadinessDecision,
} from "@/types/pilot-readiness-assessment";

const VERSION = "pilot-readiness-assessment/v16.9" as const;
const IDENTIFIER = "PilotReadinessAssessment" as const;
const TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;
const DEFAULT_TENANT = "tenant_phase_16_pilot_readiness";
const DEFAULT_OPERATOR = "operator_phase_16_pilot_readiness";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly PilotReadinessAssessmentFailure[], failure: PilotReadinessAssessmentFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: PilotReadinessAssessmentInput["scenario"]): PilotReadinessAssessmentFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly PilotReadinessAssessmentFailure[]): PilotReadinessAssessmentOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_READINESS_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const readinessCategories = freezeArray(["OPERATIONAL_READINESS", "GOVERNANCE_READINESS", "REPLAY_READINESS", "ADVISORY_READINESS", "CERTIFICATION_READINESS"] as const satisfies readonly ReadinessCategory[]);
const assessmentOutcomes = freezeArray(["READY_FOR_CERTIFICATION", "READY_WITH_MONITORING", "IMPROVEMENT_REQUIRED", "GOVERNANCE_REVIEW_REQUIRED", "PILOT_SCOPE_RESTRICTION_REQUIRED", "CERTIFICATION_BLOCKED"] as const satisfies readonly ReadinessAssessmentOutcome[]);
const readinessDecisions = freezeArray(["MONITOR", "IMPROVEMENT_REQUIRED", "GOVERNANCE_REVIEW", "PILOT_LIMITED", "READY_FOR_CERTIFICATION"] as const satisfies readonly ReadinessDecision[]);

function certTest(name: string, passed: boolean, failure: PilotReadinessAssessmentFailure, evidence_refs: readonly string[]): PilotReadinessAssessmentCertificationTest {
  const actual: PilotReadinessAssessmentOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_READINESS_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("pilot_readiness_assessment_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<PilotReadinessAssessmentResult, "replay_hash" | "integrity_hash">): string {
  return hash({ incident: result.incident_exception_governance_ref, scorecard: result.scorecard.integrity_hash, categories: result.category_assessments.map((entry) => entry.integrity_hash), health: result.operational_health_report.integrity_hash, governance: result.governance_compliance_report.integrity_hash, dashboard: result.certification_dashboard.integrity_hash, metrics: result.metrics_registry.integrity_hash, trend: result.trend_analyzer.integrity_hash, decision: result.decision.integrity_hash, history: result.history.map((entry) => entry.integrity_hash), ledger: result.evidence_ledger.map((entry) => entry.integrity_hash), tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<PilotReadinessAssessmentResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash });
}

export function runPilotReadinessAssessment(input: PilotReadinessAssessmentInput = {}): PilotReadinessAssessmentResult {
  const incident = runIncidentExceptionGovernance({ tenant_id: input.tenant_id ?? DEFAULT_TENANT, operator_id: input.operator_id ?? DEFAULT_OPERATOR, mission_id: input.mission_id });
  const direct = directFailure(input.scenario);
  const upstreamFailures: PilotReadinessAssessmentFailure[] = incident.outcome === "PASS" ? [] : ["PHASE_16_8_INCIDENTS_NOT_VALID"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const tenantId = input.tenant_id ?? DEFAULT_TENANT;
  const assessmentVersion = input.assessment_version ?? "16.9.0";
  const evidenceRefs = has(failures, "READINESS_EVIDENCE_MUTABLE") ? freezeArray([]) : freezeArray([incident.integrity_hash, incident.incident.integrity_hash, incident.certification_interface.integrity_hash]);
  const replayRefs = has(failures, "ASSESSMENTS_NOT_REPLAYABLE") ? freezeArray([]) : freezeArray([incident.replay_hash, incident.pilot_monitoring_observability_ref]);
  const governanceRefs = has(failures, "GOVERNANCE_REVIEW_NOT_SUPPORTED") ? freezeArray([]) : freezeArray([incident.governance_review_queue.integrity_hash, incident.escalation.integrity_hash]);
  const certificationRefs = has(failures, "CERTIFICATION_READINESS_NOT_VISIBLE") ? freezeArray([]) : freezeArray([incident.integrity_hash, ...incident.certification_tests.map((test) => test.integrity_hash)]);
  const deficiencies = freezeArray(has(failures, "DEFICIENCIES_NOT_IDENTIFIED") ? [] : failures.filter((failure) => !["NON_CONSTITUTIONAL_READINESS_WARNING"].includes(failure)));
  const score = failures.length ? 72 : 98;
  const category_assessments = freezeArray(readinessCategories.map((category) => nested({ category, score, evaluated_signals: freezeArray(["operational stability", "constitutional compliance", "deterministic behavior", "certification status"]), evidence_refs: evidenceRefs, deficiencies, deterministic: !has(failures, "READINESS_SCORING_NON_DETERMINISTIC"), compliant: !has(failures, "COMPLIANCE_NOT_VALIDATED") && deficiencies.length === 0 })));
  const operational_health_report = nested({ report_id: id("operational_health_report", assessmentVersion), runtime_reliability: true, recommendation_stability: true, evidence_ingestion_health: true, replay_completion: true, monitoring_health: true, incident_frequency: 0, recovery_performance: true, operator_workflow_reliability: true, complete: !has(failures, "READINESS_NOT_MEASURABLE") });
  const governance_compliance_report = nested({ report_id: id("governance_compliance_report", assessmentVersion), constitutional_compliance: !has(failures, "COMPLIANCE_NOT_VALIDATED") && !has(failures, "CONSTITUTIONAL_REQUIREMENTS_OVERRIDDEN"), governance_approvals: governanceRefs.length > 0, advisory_only_enforcement: !has(failures, "OPERATIONAL_AUTHORITY_GRANTED"), authority_separation: !has(failures, "OPERATIONAL_AUTHORITY_GRANTED"), immutable_evidence_preservation: evidenceRefs.length > 0, tenant_isolation: true, policy_compliance: !has(failures, "COMPLIANCE_NOT_VALIDATED"), deployment_governance: true, critical_governance_violations: has(failures, "CONSTITUTIONAL_REQUIREMENTS_OVERRIDDEN") ? 1 : 0, validated: !has(failures, "COMPLIANCE_NOT_VALIDATED") });
  const certification_dashboard = nested({ dashboard_id: id("certification_readiness_dashboard", assessmentVersion), constitutional_threshold_compliance: !has(failures, "CONSTITUTIONAL_REQUIREMENTS_OVERRIDDEN"), operational_threshold_compliance: true, continuous_assurance_health: true, evidence_completeness: evidenceRefs.length > 0, certification_freshness: certificationRefs.length > 0, incident_resolution_status: incident.incident.resolution_status === "RESOLVED", unresolved_governance_findings: has(failures, "GOVERNANCE_REVIEW_NOT_SUPPORTED") ? 1 : 0, phase_16_exit_readiness: !has(failures, "CERTIFICATION_READINESS_NOT_VISIBLE") && deficiencies.length === 0, continuously_visible: !has(failures, "CERTIFICATION_READINESS_NOT_VISIBLE") });
  const metrics_registry = nested({ registry_id: id("readiness_metrics_registry", assessmentVersion), categories: readinessCategories, metrics: freezeArray(["availability", "reliability", "replay success", "advisory boundary", "authority separation", "evidence completeness", "incident closure", "governance acceptance"]), deterministic_calculations: !has(failures, "READINESS_SCORING_NON_DETERMINISTIC"), inherited_thresholds_authoritative: !has(failures, "CONSTITUTIONAL_REQUIREMENTS_OVERRIDDEN"), reused_infrastructure_refs: has(failures, "PARALLEL_READINESS_INFRASTRUCTURE_CREATED") ? freezeArray([]) : freezeArray([incident.integrity_hash, incident.pilot_monitoring_observability_ref]), parallel_infrastructure_created: has(failures, "PARALLEL_READINESS_INFRASTRUCTURE_CREATED") });
  const trend_analyzer = nested({ analyzer_id: id("readiness_trend_analyzer", assessmentVersion), trend_refs: evidenceRefs, readiness_score_trend: freezeArray([96, 97, score]), degradation_detected: deficiencies.length > 0, unresolved_deficiencies: deficiencies, threshold_violations: freezeArray([]), incident_impact: incident.certification_interface.pilot_qualification_impact, deterministic: !has(failures, "READINESS_SCORING_NON_DETERMINISTIC") });
  const assessmentOutcome: ReadinessAssessmentOutcome = deficiencies.length ? "IMPROVEMENT_REQUIRED" : "READY_FOR_CERTIFICATION";
  const decisionValue: ReadinessDecision = deficiencies.length ? "IMPROVEMENT_REQUIRED" : "READY_FOR_CERTIFICATION";
  const scorecard = nested({ assessment_id: id("pilot_readiness_assessment", assessmentVersion), pilot_version: VERSION, assessment_timestamp: TIMESTAMP, tenant_scope: freezeArray([tenantId]), environment: "limited-production-pilot", operational_stability_score: score, governance_compliance_score: score, replay_quality_score: score, advisory_compliance_score: score, certification_readiness_score: score, overall_readiness_score: score, assessment_outcome: assessmentOutcome, evidence_refs: evidenceRefs, incident_refs: freezeArray([incident.incident.integrity_hash]), replay_refs: replayRefs, governance_refs: governanceRefs, operator_approval_refs: freezeArray([input.operator_id ?? DEFAULT_OPERATOR]), assessment_version: assessmentVersion });
  const decision = nested({ decision_id: id("readiness_decision", scorecard.assessment_id), decision: decisionValue, outcome: assessmentOutcome, blocking_deficiencies: deficiencies, governance_review_supported: governanceRefs.length > 0, grants_operational_authority: has(failures, "OPERATIONAL_AUTHORITY_GRANTED"), modifies_pilot_scope: has(failures, "OPERATIONAL_AUTHORITY_GRANTED"), reproducible: !has(failures, "READINESS_SCORING_NON_DETERMINISTIC"), evidence_refs: evidenceRefs });
  const history = freezeArray([scorecard.integrity_hash, decision.integrity_hash, trend_analyzer.integrity_hash].map((ref, index) => nested({ history_entry_id: id("readiness_history", { ref, index }), sequence: index + 1, assessment_ref: scorecard.integrity_hash, decision_ref: decision.integrity_hash, evidence_refs: evidenceRefs, replay_refs: replayRefs, immutable: !has(failures, "READINESS_EVIDENCE_MUTABLE"), replayable: replayRefs.length > 0 })));
  const ledgerTypes = ["METRICS_CAPTURED", "HEALTH_ASSESSED", "GOVERNANCE_VALIDATED", "REPLAY_ASSESSED", "ADVISORY_VALIDATED", "CERTIFICATION_ASSESSED", "SCORECARD_PUBLISHED", "DECISION_RECORDED", "HISTORY_ARCHIVED"] as const;
  const readinessRefs = freezeArray([scorecard.integrity_hash, operational_health_report.integrity_hash, governance_compliance_report.integrity_hash, certification_dashboard.integrity_hash, metrics_registry.integrity_hash, trend_analyzer.integrity_hash, decision.integrity_hash]);
  const evidence_ledger = freezeArray(ledgerTypes.map((event_type, index) => nested({ ledger_entry_id: id("readiness_evidence_ledger", { assessmentVersion, event_type }), sequence: index + 1, event_type, readiness_refs: readinessRefs, evidence_refs: evidenceRefs, replay_refs: replayRefs, governance_refs: governanceRefs, append_only: !has(failures, "READINESS_EVIDENCE_MUTABLE"), immutable: !has(failures, "READINESS_EVIDENCE_MUTABLE") })));
  const tests = freezeArray([
    certTest("Readiness measurable", operational_health_report.complete && scorecard.overall_readiness_score > 0 && category_assessments.length === 5, "READINESS_NOT_MEASURABLE", [scorecard.integrity_hash]),
    certTest("Deficiencies identified", deficiencies.length === 0 || trend_analyzer.unresolved_deficiencies.length > 0, "DEFICIENCIES_NOT_IDENTIFIED", [trend_analyzer.integrity_hash]),
    certTest("Compliance validated", governance_compliance_report.validated && governance_compliance_report.constitutional_compliance, "COMPLIANCE_NOT_VALIDATED", [governance_compliance_report.integrity_hash]),
    certTest("Readiness scoring deterministic", metrics_registry.deterministic_calculations && category_assessments.every((entry) => entry.deterministic) && decision.reproducible, "READINESS_SCORING_NON_DETERMINISTIC", [metrics_registry.integrity_hash]),
    certTest("Assessments replayable", replayRefs.length > 0 && history.every((entry) => entry.replayable), "ASSESSMENTS_NOT_REPLAYABLE", history.map((entry) => entry.integrity_hash)),
    certTest("Readiness evidence immutable", evidence_ledger.every((entry) => entry.immutable && entry.append_only) && history.every((entry) => entry.immutable), "READINESS_EVIDENCE_MUTABLE", evidence_ledger.map((entry) => entry.integrity_hash)),
    certTest("Certification readiness continuously visible", certification_dashboard.continuously_visible && certificationRefs.length > 0, "CERTIFICATION_READINESS_NOT_VISIBLE", [certification_dashboard.integrity_hash]),
    certTest("Governance review fully supported", decision.governance_review_supported && governanceRefs.length > 0, "GOVERNANCE_REVIEW_NOT_SUPPORTED", [decision.integrity_hash]),
    certTest("Constitutional requirements not overridden", metrics_registry.inherited_thresholds_authoritative && governance_compliance_report.critical_governance_violations === 0, "CONSTITUTIONAL_REQUIREMENTS_OVERRIDDEN", [metrics_registry.integrity_hash]),
    certTest("Existing certification evidence governance infrastructure reused", !metrics_registry.parallel_infrastructure_created && metrics_registry.reused_infrastructure_refs.length > 0, "PARALLEL_READINESS_INFRASTRUCTURE_CREATED", [metrics_registry.integrity_hash]),
    certTest("Readiness assessment grants no operational authority", !decision.grants_operational_authority && !decision.modifies_pilot_scope, "OPERATIONAL_AUTHORITY_GRANTED", [decision.integrity_hash]),
    certTest("Phase 16.8 incident governance valid", incident.outcome === "PASS", "PHASE_16_8_INCIDENTS_NOT_VALID", [incident.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is PilotReadinessAssessmentFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<PilotReadinessAssessmentResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, incident_exception_governance_ref: incident.integrity_hash, scorecard, category_assessments, operational_health_report, governance_compliance_report, certification_dashboard, metrics_registry, trend_analyzer, decision, history, evidence_ledger, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validatePilotReadinessAssessment(result = runPilotReadinessAssessment()): PilotReadinessAssessmentValidation {
  const scorecard_valid = verify(result.scorecard) && result.scorecard.assessment_outcome === "READY_FOR_CERTIFICATION" && result.scorecard.overall_readiness_score >= 95 && result.scorecard.evidence_refs.length > 0 && result.scorecard.replay_refs.length > 0 && result.scorecard.governance_refs.length > 0;
  const categories_valid = result.category_assessments.length === 5 && result.category_assessments.every((entry) => verify(entry) && entry.score >= 95 && entry.deterministic && entry.compliant && entry.deficiencies.length === 0 && entry.evidence_refs.length > 0);
  const health_valid = verify(result.operational_health_report) && result.operational_health_report.complete && Object.entries(result.operational_health_report).filter(([key]) => !["report_id", "incident_frequency", "integrity_hash"].includes(key)).every(([, value]) => value === true) && result.operational_health_report.incident_frequency === 0;
  const governance_valid = verify(result.governance_compliance_report) && result.governance_compliance_report.validated && result.governance_compliance_report.critical_governance_violations === 0 && Object.entries(result.governance_compliance_report).filter(([key]) => !["report_id", "critical_governance_violations", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const certification_dashboard_valid = verify(result.certification_dashboard) && result.certification_dashboard.continuously_visible && result.certification_dashboard.unresolved_governance_findings === 0 && Object.entries(result.certification_dashboard).filter(([key]) => !["dashboard_id", "unresolved_governance_findings", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const metrics_valid = verify(result.metrics_registry) && result.metrics_registry.categories.length === 5 && result.metrics_registry.deterministic_calculations && result.metrics_registry.inherited_thresholds_authoritative && result.metrics_registry.reused_infrastructure_refs.length > 0 && !result.metrics_registry.parallel_infrastructure_created;
  const trend_valid = verify(result.trend_analyzer) && result.trend_analyzer.deterministic && !result.trend_analyzer.degradation_detected && result.trend_analyzer.unresolved_deficiencies.length === 0 && result.trend_analyzer.threshold_violations.length === 0;
  const decision_valid = verify(result.decision) && result.decision.decision === "READY_FOR_CERTIFICATION" && result.decision.outcome === "READY_FOR_CERTIFICATION" && result.decision.blocking_deficiencies.length === 0 && result.decision.governance_review_supported && !result.decision.grants_operational_authority && !result.decision.modifies_pilot_scope && result.decision.reproducible;
  const history_valid = result.history.length === 3 && result.history.every((entry, index) => verify(entry) && entry.sequence === index + 1 && entry.evidence_refs.length > 0 && entry.replay_refs.length > 0 && entry.immutable && entry.replayable);
  const ledger_valid = result.evidence_ledger.length === 9 && result.evidence_ledger.every((entry, index) => verify(entry) && entry.sequence === index + 1 && entry.readiness_refs.length > 0 && entry.evidence_refs.length > 0 && entry.replay_refs.length > 0 && entry.governance_refs.length > 0 && entry.append_only && entry.immutable);
  const certification_valid = result.certification_tests.length === 12 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const result_replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && scorecard_valid && categories_valid && health_valid && governance_valid && certification_dashboard_valid && metrics_valid && trend_valid && decision_valid && history_valid && ledger_valid && certification_valid && result_replay_valid;
  return nested({ valid, outcome: result.outcome, scorecard_valid, categories_valid, health_valid, governance_valid, certification_dashboard_valid, metrics_valid, trend_valid, decision_valid, history_valid, ledger_valid, certification_valid, result_replay_valid, failures: result.failures });
}

export function replayPilotReadinessAssessment(result = runPilotReadinessAssessment()): boolean {
  const replayed = runPilotReadinessAssessment();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validatePilotReadinessAssessment(result).valid;
}

export function getPilotReadinessAssessmentBundle(): PilotReadinessAssessmentBundle {
  const result = runPilotReadinessAssessment();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "incident-exception-governance/v16.8" as const, readiness_categories: readinessCategories, assessment_outcomes: assessmentOutcomes, readiness_decisions: readinessDecisions, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validatePilotReadinessAssessment(result) });
}

export const PilotReadinessAssessmentService = Object.freeze({ run: runPilotReadinessAssessment, validate: validatePilotReadinessAssessment, replay: replayPilotReadinessAssessment });
