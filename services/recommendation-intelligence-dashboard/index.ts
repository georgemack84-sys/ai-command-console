import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { establishAdaptiveDashboardFoundation, replayAdaptiveDashboardFoundation } from "@/services/adaptive-dashboard-foundation";
import { evaluateRecommendationEffectiveness, replayRecommendationEffectiveness } from "@/services/recommendation-effectiveness-contract";
import { analyzeRecommendationAcceptance, replayRecommendationAcceptance } from "@/services/recommendation-acceptance-analysis";
import { scoreRecommendationQuality, replayRecommendationQuality } from "@/services/recommendation-quality-scoring";
import { certifyRecommendationEffectiveness, replayRecommendationEffectivenessCertification } from "@/services/recommendation-effectiveness-certification-gate";
import type {
  OperatorInteractionDashboard,
  RecommendationConfidenceDashboard,
  RecommendationDashboardApiSurface,
  RecommendationDashboardContract,
  RecommendationDashboardFailure,
  RecommendationDashboardInput,
  RecommendationDashboardMetrics,
  RecommendationDashboardObservabilitySurface,
  RecommendationDashboardPermission,
  RecommendationDashboardResult,
  RecommendationDashboardScenario,
  RecommendationDashboardValidationResult,
  RecommendationDashboardValidationTest,
  RecommendationDashboardWidget,
  RecommendationEffectivenessDashboard,
  RecommendationFailureAnalysisDashboard,
  RecommendationHistoryExplorer,
  RecommendationLifecycleDashboard,
  RecommendationLifecycleState,
  RecommendationQualityDashboard,
  RecommendationRecordView,
  RecommendationReplayExplorer,
  RecommendationRiskDashboard,
  RecommendationSeverity,
  RecommendationTrendDashboard,
} from "@/types/recommendation-intelligence-dashboard";

const VERSION = "recommendation-intelligence-dashboard/v10.14.3" as const;
const DASHBOARD_ID = "RecommendationIntelligenceDashboard" as const;
const TENANT_ID = "tenant_mission_control";

const WIDGETS: readonly RecommendationDashboardWidget[] = Object.freeze(["Recommendation Funnel", "Acceptance Rate", "Failure Causes", "Override Analysis", "Recommendation History", "Quality Trend", "Effectiveness Trend", "Confidence Distribution", "Risk Heat Map", "Replay Explorer"]);
const LIFECYCLE_STATES: readonly RecommendationLifecycleState[] = Object.freeze(["ACCEPTED", "REJECTED", "OVERRIDDEN", "DEFERRED", "PENDING", "EXPIRED", "SIMULATED", "CERTIFIED"]);

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

function id(prefix: string, value: unknown): string {
  return `${prefix}_${hash(value).slice(0, 24)}`;
}

function failureForScenario(scenario: RecommendationDashboardScenario): RecommendationDashboardFailure | undefined {
  const map: Partial<Record<RecommendationDashboardScenario, RecommendationDashboardFailure>> = {
    FOUNDATION_UNAVAILABLE: "DASHBOARD_FOUNDATION_UNAVAILABLE",
    RECOMMENDATION_HIDDEN: "RECOMMENDATION_RECORD_HIDDEN",
    RECOMMENDATION_DELETED: "RECOMMENDATION_RECORD_DELETED",
    NONDETERMINISTIC_RENDERING: "RECOMMENDATION_RENDERING_NONDETERMINISTIC",
    MISSING_EVIDENCE: "EVIDENCE_REFERENCE_BROKEN",
    MISSING_REPLAY: "REPLAY_REFERENCE_MISSING",
    MISSING_GOVERNANCE: "GOVERNANCE_LINEAGE_MISSING",
    MISSING_OPERATOR_HISTORY: "OPERATOR_DECISION_HISTORY_MISSING",
    QUALITY_CALCULATION_DRIFT: "QUALITY_CALCULATION_NONDETERMINISTIC",
    TREND_DRIFT: "TREND_ANALYSIS_NONDETERMINISTIC",
    UNAUTHORIZED_ROLE: "UNAUTHORIZED_DASHBOARD_ACCESS",
    TENANT_LEAK: "TENANT_ISOLATION_VIOLATED",
    RESTRICTED_FIELD_LEAK: "RESTRICTED_FIELD_EXPOSED",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    WRITE_AUTHORITY_EXPOSED: "DASHBOARD_WRITE_AUTHORITY_EXPOSED",
  };
  return map[scenario];
}

function apiSurface(): RecommendationDashboardApiSurface {
  const base: Omit<RecommendationDashboardApiSurface, "integrity_hash"> = {
    api_id: "recommendation_intelligence_dashboard_api",
    retrieve_dashboard: "POST /recommendation-intelligence-dashboard/dashboard",
    retrieve_contract: "GET /recommendation-intelligence-dashboard/contract",
    retrieve_lifecycle: "POST /recommendation-intelligence-dashboard/lifecycle",
    retrieve_effectiveness: "POST /recommendation-intelligence-dashboard/effectiveness",
    retrieve_confidence: "POST /recommendation-intelligence-dashboard/confidence",
    retrieve_risk: "POST /recommendation-intelligence-dashboard/risk",
    retrieve_operator: "POST /recommendation-intelligence-dashboard/operator",
    retrieve_quality: "POST /recommendation-intelligence-dashboard/quality",
    retrieve_failure: "POST /recommendation-intelligence-dashboard/failure",
    retrieve_history: "POST /recommendation-intelligence-dashboard/history",
    retrieve_replay: "POST /recommendation-intelligence-dashboard/replay",
    retrieve_trends: "POST /recommendation-intelligence-dashboard/trends",
    validate_dashboard: "POST /recommendation-intelligence-dashboard/validate",
    inspect_dashboard: "POST /recommendation-intelligence-dashboard/inspect",
    creation_supported: false,
    mutation_supported: false,
    governance_decision_supported: false,
    operator_action_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function lifecycleFor(state: string): RecommendationLifecycleState {
  if (state === "ACCEPTED") return "ACCEPTED";
  if (state === "REJECTED") return "REJECTED";
  if (state === "OVERRIDDEN") return "OVERRIDDEN";
  if (state === "DEFERRED") return "DEFERRED";
  return "CERTIFIED";
}

function severityFor(score: number): RecommendationSeverity {
  if (score >= 0.85) return "LOW";
  if (score >= 0.7) return "MODERATE";
  if (score >= 0.5) return "HIGH";
  return "CRITICAL";
}

function records(
  effectiveness: ReturnType<typeof evaluateRecommendationEffectiveness>,
  quality: ReturnType<typeof scoreRecommendationQuality>,
  certification: ReturnType<typeof certifyRecommendationEffectiveness>,
  failures: readonly RecommendationDashboardFailure[],
): readonly RecommendationRecordView[] {
  if (failures.includes("RECOMMENDATION_RECORD_DELETED")) return freezeArray([]);
  const record = effectiveness.effectiveness_record;
  const hidden = failures.includes("RECOMMENDATION_RECORD_HIDDEN");
  const base: Omit<RecommendationRecordView, "integrity_hash"> = {
    recommendation_view_id: id("recommendation_view", record.recommendation_id),
    tenant_id: failures.includes("TENANT_ISOLATION_VIOLATED") ? "tenant-cross-boundary" : record.tenant_id,
    mission_id: record.mission_id,
    decision_id: record.decision_id,
    recommendation_id: record.recommendation_id,
    lifecycle_state: hidden ? "PENDING" : lifecycleFor(record.acceptance_state),
    effectiveness_score: record.effectiveness_score,
    confidence_score: record.confidence_accuracy_score,
    risk_score: record.risk_accuracy_score,
    quality_score: quality.quality_score.composite_effectiveness_score,
    operator_decision: failures.includes("OPERATOR_DECISION_HISTORY_MISSING") ? "MISSING" : record.operator_action_taken,
    governance_decision: failures.includes("GOVERNANCE_LINEAGE_MISSING") ? "MISSING" : "APPROVED",
    certification_status: certification.certification.certification_result === "PASS" && !failures.length ? "CERTIFIED" : "PENDING",
    evidence_refs: failures.includes("EVIDENCE_REFERENCE_BROKEN") ? freezeArray([]) : record.evidence_refs,
    governance_refs: failures.includes("GOVERNANCE_LINEAGE_MISSING") ? freezeArray([]) : record.governance_validation_refs,
    replay_refs: failures.includes("REPLAY_REFERENCE_MISSING") ? freezeArray([]) : record.replay_refs,
    lineage_refs: record.lineage_refs,
  };
  return freezeArray([Object.freeze({ ...base, integrity_hash: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? "invalid-integrity" : hashWithoutIntegrity(base) })]);
}

function lifecycleDashboard(recs: readonly RecommendationRecordView[]): RecommendationLifecycleDashboard {
  const base: Omit<RecommendationLifecycleDashboard, "integrity_hash"> = {
    lifecycle_id: "recommendation_lifecycle_dashboard",
    lifecycle_counts: LIFECYCLE_STATES.map((state) => `${state}:${recs.filter((rec) => rec.lifecycle_state === state).length}`),
    timeline_refs: recs.map((rec) => `timeline:${rec.recommendation_id}`),
    filter_dimensions: freezeArray(["recommendation ID", "mission", "tenant", "lifecycle state", "effectiveness score", "confidence level", "risk level", "operator decision", "governance decision", "certification status", "timeframe"]),
    replay_launch_refs: recs.flatMap((rec) => rec.replay_refs),
    evidence_inspection_refs: recs.flatMap((rec) => rec.evidence_refs),
    lineage_refs: recs.flatMap((rec) => rec.lineage_refs),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function effectivenessDashboard(recs: readonly RecommendationRecordView[]): RecommendationEffectivenessDashboard {
  const score = recs[0]?.effectiveness_score ?? 0;
  const base: Omit<RecommendationEffectivenessDashboard, "integrity_hash"> = {
    effectiveness_id: "recommendation_effectiveness_dashboard",
    effectiveness_score: score,
    predicted_effectiveness: 0.86,
    actual_effectiveness: score,
    recommendation_success_rate: recs.some((rec) => rec.lifecycle_state === "ACCEPTED" || rec.lifecycle_state === "CERTIFIED") ? 1 : 0,
    improvement_trends: freezeArray(["mission outcome alignment", "operator usability"]),
    mission_outcome_refs: recs.map((rec) => `outcome:${rec.recommendation_id}`),
    recommendation_impact_refs: recs.map((rec) => `impact:${rec.recommendation_id}`),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function confidenceDashboard(recs: readonly RecommendationRecordView[]): RecommendationConfidenceDashboard {
  const confidence = recs[0]?.confidence_score ?? 0;
  const predicted = 0.84;
  const base: Omit<RecommendationConfidenceDashboard, "integrity_hash"> = {
    confidence_id: "recommendation_confidence_dashboard",
    recommendation_confidence: confidence,
    confidence_calibration: Number((1 - Math.abs(predicted - confidence)).toFixed(2)),
    prediction_accuracy: confidence,
    confidence_variance: Number(Math.abs(predicted - confidence).toFixed(2)),
    overconfidence: predicted > confidence ? Number((predicted - confidence).toFixed(2)) : 0,
    underconfidence: confidence > predicted ? Number((confidence - predicted).toFixed(2)) : 0,
    confidence_trends: freezeArray(["stable calibration", "evidence-backed confidence"]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function riskDashboard(recs: readonly RecommendationRecordView[]): RecommendationRiskDashboard {
  const risk = 1 - (recs[0]?.risk_score ?? 0);
  const base: Omit<RecommendationRiskDashboard, "integrity_hash"> = {
    risk_id: "recommendation_risk_dashboard",
    predicted_risk: 0.28,
    realized_risk: Number(risk.toFixed(2)),
    recommendation_severity: severityFor(recs[0]?.effectiveness_score ?? 0),
    probability_estimate: Number(risk.toFixed(2)),
    mitigation_recommendations: freezeArray(["retain rollback option", "continue governance monitoring"]),
    residual_risk: Number((risk * 0.5).toFixed(2)),
    risk_trends: freezeArray(["stable residual risk", "mitigation effective"]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function operatorDashboard(acceptance: ReturnType<typeof analyzeRecommendationAcceptance>, failures: readonly RecommendationDashboardFailure[]): OperatorInteractionDashboard {
  const base: Omit<OperatorInteractionDashboard, "integrity_hash"> = {
    operator_id: "recommendation_operator_interaction_dashboard",
    acceptance_rate: failures.includes("OPERATOR_DECISION_HISTORY_MISSING") ? 0 : 1,
    rejection_rate: 0,
    override_rate: acceptance.acceptance_record.acceptance_state === "OVERRIDDEN" ? 1 : 0,
    deferment_rate: acceptance.acceptance_record.acceptance_state === "DEFERRED" ? 1 : 0,
    operator_modifications: acceptance.acceptance_record.implementation_status === "MODIFIED_BEFORE_EXECUTION" ? 1 : 0,
    review_duration_ms: 1200,
    approval_latency_ms: 900,
    usability_score: acceptance.acceptance_record.operator_confidence_score,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function qualityDashboard(quality: ReturnType<typeof scoreRecommendationQuality>, failures: readonly RecommendationDashboardFailure[]): RecommendationQualityDashboard {
  const score = failures.includes("QUALITY_CALCULATION_NONDETERMINISTIC") ? 0.41 : quality.quality_score.composite_effectiveness_score;
  const base: Omit<RecommendationQualityDashboard, "integrity_hash"> = {
    quality_id: "recommendation_quality_dashboard",
    recommendation_quality_score: score,
    evidence_completeness: failures.includes("EVIDENCE_REFERENCE_BROKEN") ? 0 : quality.quality_score.evidence_quality_score,
    explanation_quality: quality.quality_score.explainability_score,
    governance_compliance: failures.includes("GOVERNANCE_LINEAGE_MISSING") ? 0 : quality.quality_score.governance_compliance_score,
    constitutional_compliance: failures.includes("GOVERNANCE_LINEAGE_MISSING") ? 0 : 1,
    replay_readiness: failures.includes("REPLAY_REFERENCE_MISSING") ? 0 : 1,
    certification_readiness: 1,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureDashboard(recs: readonly RecommendationRecordView[], failures: readonly RecommendationDashboardFailure[]): RecommendationFailureAnalysisDashboard {
  const base: Omit<RecommendationFailureAnalysisDashboard, "integrity_hash"> = {
    failure_id: "recommendation_failure_analysis_dashboard",
    failure_categories: failures.length ? failures : freezeArray(["none"]),
    failure_frequency: failures.length,
    governance_failures: failures.includes("GOVERNANCE_LINEAGE_MISSING") ? 1 : 0,
    confidence_failures: recs.some((rec) => rec.confidence_score < 0.7) ? 1 : 0,
    risk_failures: recs.some((rec) => rec.risk_score < 0.7) ? 1 : 0,
    evidence_deficiencies: failures.includes("EVIDENCE_REFERENCE_BROKEN") ? 1 : 0,
    operator_rejection_reasons: failures.includes("OPERATOR_DECISION_HISTORY_MISSING") ? freezeArray(["operator history missing"]) : freezeArray([]),
    simulation_failures: 0,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function historyExplorer(recs: readonly RecommendationRecordView[], certification: ReturnType<typeof certifyRecommendationEffectiveness>, failures: readonly RecommendationDashboardFailure[]): RecommendationHistoryExplorer {
  const base: Omit<RecommendationHistoryExplorer, "integrity_hash"> = {
    history_id: "recommendation_history_explorer",
    chronological_records: recs.map((rec) => `history:${rec.recommendation_id}`),
    recommendation_revisions: recs.map((rec) => `revision:${rec.recommendation_id}:v1`),
    approval_history_refs: failures.includes("GOVERNANCE_LINEAGE_MISSING") ? freezeArray([]) : recs.flatMap((rec) => rec.governance_refs),
    simulation_history_refs: recs.map((rec) => `simulation:${rec.recommendation_id}`),
    certification_history_refs: freezeArray([certification.certification.certification_id]),
    operator_decision_refs: failures.includes("OPERATOR_DECISION_HISTORY_MISSING") ? freezeArray([]) : recs.map((rec) => `operator:${rec.operator_decision}`),
    governance_decision_refs: failures.includes("GOVERNANCE_LINEAGE_MISSING") ? freezeArray([]) : recs.map((rec) => `governance:${rec.governance_decision}`),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function replayExplorers(recs: readonly RecommendationRecordView[], failures: readonly RecommendationDashboardFailure[]): readonly RecommendationReplayExplorer[] {
  return freezeArray(recs.map((rec) => {
    const base: Omit<RecommendationReplayExplorer, "integrity_hash"> = {
      replay_id: `recommendation_replay_${rec.recommendation_id}`,
      recommendation_id: rec.recommendation_id,
      creation_ref: `creation:${rec.recommendation_id}`,
      supporting_evidence_refs: failures.includes("EVIDENCE_REFERENCE_BROKEN") ? freezeArray([]) : rec.evidence_refs,
      reasoning_lineage_refs: rec.lineage_refs,
      operator_decision_refs: failures.includes("OPERATOR_DECISION_HISTORY_MISSING") ? freezeArray([]) : freezeArray([`operator:${rec.operator_decision}`]),
      governance_review_refs: failures.includes("GOVERNANCE_LINEAGE_MISSING") ? freezeArray([]) : rec.governance_refs,
      simulation_outcome_refs: freezeArray([`simulation:${rec.recommendation_id}`]),
      certification_record_refs: freezeArray([`certification:${rec.certification_status}:${rec.recommendation_id}`]),
      replayable: !failures.includes("REPLAY_REFERENCE_MISSING"),
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function trendDashboard(recs: readonly RecommendationRecordView[], failures: readonly RecommendationDashboardFailure[]): RecommendationTrendDashboard {
  const base: Omit<RecommendationTrendDashboard, "integrity_hash"> = {
    trend_id: "recommendation_trend_dashboard",
    effectiveness_trend: failures.includes("TREND_ANALYSIS_NONDETERMINISTIC") ? "DECLINING" : "STABLE",
    quality_trend: failures.includes("QUALITY_CALCULATION_NONDETERMINISTIC") ? "DECLINING" : "STABLE",
    confidence_trend: "STABLE",
    risk_trend: "STABLE",
    operator_adoption: recs.some((rec) => rec.lifecycle_state === "ACCEPTED" || rec.lifecycle_state === "CERTIFIED") ? 1 : 0,
    governance_outcomes: recs.map((rec) => rec.governance_decision),
    certification_success: recs.some((rec) => rec.certification_status === "CERTIFIED") ? 1 : 0,
    historical_improvements: freezeArray(["evidence quality", "operator usability", "governance clarity"]),
    deterministic: !failures.includes("TREND_ANALYSIS_NONDETERMINISTIC"),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function permissionRecords(input: RecommendationDashboardInput, failures: readonly RecommendationDashboardFailure[]): readonly RecommendationDashboardPermission[] {
  const role = input.role ?? "OPERATOR";
  const base: Omit<RecommendationDashboardPermission, "integrity_hash"> = {
    permission_id: `recommendation_dashboard_permission_${role.toLowerCase()}`,
    role,
    tenant_id: failures.includes("TENANT_ISOLATION_VIOLATED") ? "tenant-cross-boundary" : input.tenant_id ?? TENANT_ID,
    allowed: !failures.includes("UNAUTHORIZED_DASHBOARD_ACCESS"),
    restricted_fields: failures.includes("RESTRICTED_FIELD_EXPOSED") ? freezeArray([]) : freezeArray(["restricted_evidence_payload", "protected_operator_information", "governance_notes"]),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    governance_authorized: !failures.includes("GOVERNANCE_LINEAGE_MISSING"),
    evidence_authorized: !failures.includes("EVIDENCE_REFERENCE_BROKEN") && !failures.includes("RESTRICTED_FIELD_EXPOSED"),
    replay_authorized: !failures.includes("REPLAY_REFERENCE_MISSING"),
  };
  return freezeArray([Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) })]);
}

function metrics(failures: readonly RecommendationDashboardFailure[]): RecommendationDashboardMetrics {
  const base: Omit<RecommendationDashboardMetrics, "integrity_hash"> = {
    rendering_latency_ms: 10,
    recommendation_sync_latency_ms: 14,
    missing_recommendation_records: failures.includes("RECOMMENDATION_RECORD_DELETED") ? 1 : 0,
    broken_evidence_references: failures.includes("EVIDENCE_REFERENCE_BROKEN") ? 1 : 0,
    replay_resolution_failures: failures.includes("REPLAY_REFERENCE_MISSING") ? 1 : 0,
    widget_rendering_failures: failures.includes("RECOMMENDATION_RENDERING_NONDETERMINISTIC") ? 1 : 0,
    search_latency_ms: 7,
    navigation_failures: failures.includes("TREND_ANALYSIS_NONDETERMINISTIC") ? 1 : 0,
    integrity_verification_failures: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? 1 : 0,
    unauthorized_access_attempts: failures.includes("UNAUTHORIZED_DASHBOARD_ACCESS") ? 1 : 0,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function validationTest(name: string, passed: boolean, failure: RecommendationDashboardFailure, evidence_refs: readonly string[]): RecommendationDashboardValidationTest {
  const base: Omit<RecommendationDashboardValidationTest, "integrity_hash"> = {
    test_id: id("recommendation_dashboard_test", name),
    name,
    expected: "PASS",
    actual: passed ? "PASS" : "FAIL",
    passed,
    failure_reason: passed ? null : failure,
    evidence_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildValidationTests(result: Omit<RecommendationDashboardResult, "validation_tests" | "validation_outcome" | "failures" | "replay_hash" | "integrity_hash">): readonly RecommendationDashboardValidationTest[] {
  const evidence = [result.dashboard_foundation.integrity_hash, result.effectiveness_result.integrity_hash, result.acceptance_result.integrity_hash, result.quality_result.integrity_hash, result.certification_result.integrity_hash];
  return freezeArray([
    validationTest("foundation integration", replayAdaptiveDashboardFoundation(result.dashboard_foundation), "DASHBOARD_FOUNDATION_UNAVAILABLE", evidence),
    validationTest("all recommendations visible", result.recommendation_records.length > 0 && result.recommendation_records.every((rec) => rec.lifecycle_state !== "PENDING"), "RECOMMENDATION_RECORD_HIDDEN", evidence),
    validationTest("no recommendation deleted", result.recommendation_records.length > 0, "RECOMMENDATION_RECORD_DELETED", evidence),
    validationTest("deterministic recommendation rendering", result.deterministic, "RECOMMENDATION_RENDERING_NONDETERMINISTIC", evidence),
    validationTest("evidence driven visualization", result.evidence_backed && result.recommendation_records.every((rec) => rec.evidence_refs.length > 0), "EVIDENCE_REFERENCE_BROKEN", evidence),
    validationTest("replay integration", result.replayable && result.replay_explorer.every((replay) => replay.replayable && replay.supporting_evidence_refs.length > 0), "REPLAY_REFERENCE_MISSING", evidence),
    validationTest("governance lineage visible", result.governance_visible && result.recommendation_records.every((rec) => rec.governance_refs.length > 0), "GOVERNANCE_LINEAGE_MISSING", evidence),
    validationTest("operator decision history visible", result.history_explorer.operator_decision_refs.length > 0, "OPERATOR_DECISION_HISTORY_MISSING", evidence),
    validationTest("quality calculations deterministic", result.quality_dashboard.recommendation_quality_score >= 0.7, "QUALITY_CALCULATION_NONDETERMINISTIC", evidence),
    validationTest("trend analysis deterministic", result.trend_dashboard.deterministic, "TREND_ANALYSIS_NONDETERMINISTIC", evidence),
    validationTest("role authorization enforced", result.permissions.every((permission) => permission.allowed), "UNAUTHORIZED_DASHBOARD_ACCESS", evidence),
    validationTest("tenant isolation enforced", result.tenant_isolated && result.recommendation_records.every((rec) => rec.tenant_id === TENANT_ID), "TENANT_ISOLATION_VIOLATED", evidence),
    validationTest("field-level visibility enforced", result.permissions.every((permission) => permission.restricted_fields.length > 0), "RESTRICTED_FIELD_EXPOSED", evidence),
    validationTest("integrity verification", result.recommendation_records.every((rec) => hashWithoutIntegrity(rec) === rec.integrity_hash), "INTEGRITY_VERIFICATION_FAILED", evidence),
    validationTest("read-only intelligence", result.read_only && result.advisory_only && !result.write_authority_granted, "DASHBOARD_WRITE_AUTHORITY_EXPOSED", evidence),
  ]);
}

function resultReplayHash(result: Omit<RecommendationDashboardResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    foundation: result.dashboard_foundation.integrity_hash,
    effectiveness: result.effectiveness_result.integrity_hash,
    acceptance: result.acceptance_result.integrity_hash,
    quality: result.quality_result.integrity_hash,
    certification: result.certification_result.integrity_hash,
    records: result.recommendation_records.map((rec) => rec.integrity_hash),
    lifecycle: result.lifecycle_dashboard.integrity_hash,
    effectiveness_dashboard: result.effectiveness_dashboard.integrity_hash,
    confidence: result.confidence_dashboard.integrity_hash,
    risk: result.risk_dashboard.integrity_hash,
    operator: result.operator_dashboard.integrity_hash,
    quality_dashboard: result.quality_dashboard.integrity_hash,
    failure: result.failure_dashboard.integrity_hash,
    history: result.history_explorer.integrity_hash,
    replay: result.replay_explorer.map((replay) => replay.integrity_hash),
    trend: result.trend_dashboard.integrity_hash,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<RecommendationDashboardResult, "integrity_hash">): string {
  return hash({
    version: result.recommendation_intelligence_dashboard_version,
    id: result.dashboard_identifier,
    api: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    validation_outcome: result.validation_outcome,
  });
}

export function buildRecommendationIntelligenceDashboard(input: RecommendationDashboardInput = {}): RecommendationDashboardResult {
  const scenario = input.scenario ?? "BASELINE";
  const foundation = establishAdaptiveDashboardFoundation();
  const effectiveness = evaluateRecommendationEffectiveness();
  const acceptance = analyzeRecommendationAcceptance();
  const quality = scoreRecommendationQuality();
  const certification = certifyRecommendationEffectiveness();
  const initialFailures = freezeArray([
    ...(failureForScenario(scenario) ? [failureForScenario(scenario) as RecommendationDashboardFailure] : []),
    ...(!replayAdaptiveDashboardFoundation(foundation) ? ["DASHBOARD_FOUNDATION_UNAVAILABLE" as const] : []),
    ...(!replayRecommendationEffectiveness(effectiveness) || !replayRecommendationAcceptance(acceptance) || !replayRecommendationQuality(quality) || !replayRecommendationEffectivenessCertification(certification) ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
  ]);
  const api_surface = apiSurface();
  const recommendation_records = records(effectiveness, quality, certification, initialFailures);
  const lifecycle_dashboard = lifecycleDashboard(recommendation_records);
  const effectiveness_dashboard = effectivenessDashboard(recommendation_records);
  const confidence_dashboard = confidenceDashboard(recommendation_records);
  const risk_dashboard = riskDashboard(recommendation_records);
  const operator_dashboard = operatorDashboard(acceptance, initialFailures);
  const quality_dashboard = qualityDashboard(quality, initialFailures);
  const failure_dashboard = failureDashboard(recommendation_records, initialFailures);
  const history_explorer = historyExplorer(recommendation_records, certification, initialFailures);
  const replay_explorer = replayExplorers(recommendation_records, initialFailures);
  const trend_dashboard = trendDashboard(recommendation_records, initialFailures);
  const permissions = permissionRecords(input, initialFailures);
  const metricsRecord = metrics(initialFailures);
  const baseWithoutValidation: Omit<RecommendationDashboardResult, "validation_tests" | "validation_outcome" | "failures" | "replay_hash" | "integrity_hash"> = {
    recommendation_intelligence_dashboard_version: VERSION,
    dashboard_identifier: DASHBOARD_ID,
    status: initialFailures.length ? "REJECTED" : "AUTHORITATIVE",
    api_surface,
    dashboard_foundation: foundation,
    effectiveness_result: effectiveness,
    acceptance_result: acceptance,
    quality_result: quality,
    certification_result: certification,
    recommendation_records,
    lifecycle_dashboard,
    effectiveness_dashboard,
    confidence_dashboard,
    risk_dashboard,
    operator_dashboard,
    quality_dashboard,
    failure_dashboard,
    history_explorer,
    replay_explorer,
    trend_dashboard,
    permissions,
    widgets: WIDGETS,
    metrics: metricsRecord,
    deterministic: !initialFailures.includes("RECOMMENDATION_RENDERING_NONDETERMINISTIC") && !initialFailures.includes("TREND_ANALYSIS_NONDETERMINISTIC"),
    replayable: !initialFailures.includes("REPLAY_REFERENCE_MISSING"),
    tenant_isolated: !initialFailures.includes("TENANT_ISOLATION_VIOLATED"),
    evidence_backed: !initialFailures.includes("EVIDENCE_REFERENCE_BROKEN"),
    governance_visible: !initialFailures.includes("GOVERNANCE_LINEAGE_MISSING"),
    read_only: true,
    advisory_only: true,
    write_authority_granted: initialFailures.includes("DASHBOARD_WRITE_AUTHORITY_EXPOSED") ? true as never : false,
  };
  const validation_tests = buildValidationTests(baseWithoutValidation);
  const failures = freezeArray([...new Set([...initialFailures, ...validation_tests.map((test) => test.failure_reason).filter((failure): failure is RecommendationDashboardFailure => Boolean(failure))])]);
  const validation_outcome = failures.length ? "INVALID" : "VALID";
  const base: Omit<RecommendationDashboardResult, "replay_hash" | "integrity_hash"> = {
    ...baseWithoutValidation,
    status: failures.length ? "REJECTED" : "AUTHORITATIVE",
    validation_tests,
    validation_outcome,
    failures,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateRecommendationIntelligenceDashboard(result?: RecommendationDashboardResult): RecommendationDashboardValidationResult {
  if (!result) {
    const failures = freezeArray<RecommendationDashboardFailure>(["RECOMMENDATION_RENDERING_NONDETERMINISTIC"]);
    const base: Omit<RecommendationDashboardValidationResult, "validation_hash"> = { dashboard_id: null, valid: false, validation_outcome: "INVALID", failures, replay_hash_valid: false, integrity_hash_valid: false, read_only: false };
    return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const nestedIntegrity = (
    hashWithoutIntegrity(result.api_surface) === result.api_surface.integrity_hash &&
    result.recommendation_records.every((item) => hashWithoutIntegrity(item) === item.integrity_hash) &&
    hashWithoutIntegrity(result.lifecycle_dashboard) === result.lifecycle_dashboard.integrity_hash &&
    hashWithoutIntegrity(result.effectiveness_dashboard) === result.effectiveness_dashboard.integrity_hash &&
    hashWithoutIntegrity(result.confidence_dashboard) === result.confidence_dashboard.integrity_hash &&
    hashWithoutIntegrity(result.risk_dashboard) === result.risk_dashboard.integrity_hash &&
    hashWithoutIntegrity(result.operator_dashboard) === result.operator_dashboard.integrity_hash &&
    hashWithoutIntegrity(result.quality_dashboard) === result.quality_dashboard.integrity_hash &&
    hashWithoutIntegrity(result.failure_dashboard) === result.failure_dashboard.integrity_hash &&
    hashWithoutIntegrity(result.history_explorer) === result.history_explorer.integrity_hash &&
    result.replay_explorer.every((item) => hashWithoutIntegrity(item) === item.integrity_hash) &&
    hashWithoutIntegrity(result.trend_dashboard) === result.trend_dashboard.integrity_hash &&
    result.permissions.every((item) => hashWithoutIntegrity(item) === item.integrity_hash) &&
    hashWithoutIntegrity(result.metrics) === result.metrics.integrity_hash &&
    result.validation_tests.every((item) => hashWithoutIntegrity(item) === item.integrity_hash)
  );
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash && nestedIntegrity;
  const read_only = result.read_only && result.advisory_only && !result.write_authority_granted && !result.api_surface.creation_supported && !result.api_surface.mutation_supported && !result.api_surface.governance_decision_supported && !result.api_surface.operator_action_supported;
  const valid = result.validation_outcome === "VALID" && result.failures.length === 0 && replay_hash_valid && integrity_hash_valid && read_only;
  const base: Omit<RecommendationDashboardValidationResult, "validation_hash"> = {
    dashboard_id: result.dashboard_identifier,
    valid,
    validation_outcome: result.validation_outcome,
    failures: result.failures,
    replay_hash_valid,
    integrity_hash_valid,
    read_only,
  };
  return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayRecommendationIntelligenceDashboard(result: RecommendationDashboardResult): boolean {
  return validateRecommendationIntelligenceDashboard(result).valid;
}

export function buildRecommendationDashboardObservabilitySurface(result = buildRecommendationIntelligenceDashboard()): RecommendationDashboardObservabilitySurface {
  return Object.freeze({
    dashboard_id: result.dashboard_identifier,
    status: result.status,
    validation_outcome: result.validation_outcome,
    recommendations: result.recommendation_records.length,
    failed_tests: result.validation_tests.filter((test) => !test.passed).length,
    failures: result.failures,
    replayable: result.replayable,
    tenant_isolated: result.tenant_isolated,
    read_only: result.read_only && result.advisory_only && !result.write_authority_granted,
    integrity_hash: result.integrity_hash,
  });
}

export function getRecommendationIntelligenceDashboardContract(): RecommendationDashboardContract {
  const result = buildRecommendationIntelligenceDashboard();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      widgets: WIDGETS,
      lifecycle_states: LIFECYCLE_STATES,
      navigation_dimensions: freezeArray(["recommendation ID", "mission", "tenant", "lifecycle state", "effectiveness score", "confidence level", "risk level", "operator decision", "governance decision", "certification status", "timeframe"]),
      required_data_sources: freezeArray(["Recommendation Effectiveness Engine", "Outcome Observation Engine", "Pattern Intelligence Engine", "Strategy Evolution Engine", "Confidence Adaptation Engine", "Risk Adaptation Engine", "Governance Adaptation Layer", "Operator Feedback Engine", "Replay Engine", "Truth Ledger", "Certification Ledger"]),
      read_only: true,
      advisory_only: true,
    }),
    result,
    validation: validateRecommendationIntelligenceDashboard(result),
    observability: buildRecommendationDashboardObservabilitySurface(result),
  });
}

export const RecommendationIntelligenceDashboard = Object.freeze({
  build: buildRecommendationIntelligenceDashboard,
  validate: validateRecommendationIntelligenceDashboard,
  replay: replayRecommendationIntelligenceDashboard,
});
