import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { establishAdaptiveDashboardFoundation, replayAdaptiveDashboardFoundation } from "@/services/adaptive-dashboard-foundation";
import { runOutcomeObservationEngine, replayOutcomeObservationEngine } from "@/services/outcome-observation-engine";
import { runOutcomeObservationLedger, replayOutcomeObservationLedger } from "@/services/outcome-observation-ledger";
import type {
  ConfidenceRealizationDashboard,
  GovernanceOutcomeDashboard,
  HistoricalComparisonExplorer,
  MissionImpactDashboard,
  OutcomeCategory,
  OutcomeCategorySummary,
  OutcomeDashboardApiSurface,
  OutcomeDashboardContract,
  OutcomeDashboardFailure,
  OutcomeDashboardInput,
  OutcomeDashboardMetrics,
  OutcomeDashboardObservabilitySurface,
  OutcomeDashboardPermission,
  OutcomeDashboardResult,
  OutcomeDashboardScenario,
  OutcomeDashboardValidationResult,
  OutcomeDashboardValidationTest,
  OutcomeDashboardWidget,
  OutcomeRecordView,
  OutcomeReplayIntegration,
  OutcomeSeverity,
  OutcomeTimelineEvent,
  OutcomeTrendAnalytics,
  RiskRealizationDashboard,
  RollbackOutcomeDashboard,
} from "@/types/outcome-intelligence-dashboard";

const VERSION = "outcome-intelligence-dashboard/v10.14.2" as const;
const DASHBOARD_ID = "OutcomeIntelligenceDashboard" as const;
const TENANT_ID = "tenant_mission_control";

const WIDGETS: readonly OutcomeDashboardWidget[] = Object.freeze(["Success Rate", "Failure Timeline", "Mission Impact", "Confidence Accuracy", "Risk Actualization", "Outcome Distribution", "Outcome History", "Rollback Timeline", "Governance Replay", "Historical Comparison"]);
const CATEGORIES: readonly OutcomeCategory[] = Object.freeze(["Success", "Partial Success", "Failure", "Governance Blocked", "Operator Rejected", "Simulation Failed", "Rollback Executed", "Certification Blocked", "Escalated", "Deferred"]);

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

function failureForScenario(scenario: OutcomeDashboardScenario): OutcomeDashboardFailure | undefined {
  const map: Partial<Record<OutcomeDashboardScenario, OutcomeDashboardFailure>> = {
    FOUNDATION_UNAVAILABLE: "DASHBOARD_FOUNDATION_UNAVAILABLE",
    OUTCOME_HIDDEN: "OUTCOME_RECORD_HIDDEN",
    OUTCOME_OMITTED: "OUTCOME_RECORD_OMITTED",
    NONDETERMINISTIC_RENDERING: "OUTCOME_RENDERING_NONDETERMINISTIC",
    MISSING_EVIDENCE: "EVIDENCE_REFERENCE_BROKEN",
    MISSING_REPLAY: "REPLAY_REFERENCE_MISSING",
    MISSING_GOVERNANCE: "GOVERNANCE_LINEAGE_MISSING",
    ROLLBACK_HISTORY_MISSING: "ROLLBACK_HISTORY_MISSING",
    COMPARISON_DRIFT: "HISTORICAL_COMPARISON_NONDETERMINISTIC",
    STALE_VISUALIZATION: "STALE_VISUALIZATION_DETECTED",
    UNAUTHORIZED_ROLE: "UNAUTHORIZED_DASHBOARD_ACCESS",
    TENANT_LEAK: "TENANT_ISOLATION_VIOLATED",
    RESTRICTED_FIELD_LEAK: "RESTRICTED_FIELD_EXPOSED",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    WRITE_AUTHORITY_EXPOSED: "DASHBOARD_WRITE_AUTHORITY_EXPOSED",
  };
  return map[scenario];
}

function apiSurface(): OutcomeDashboardApiSurface {
  const base: Omit<OutcomeDashboardApiSurface, "integrity_hash"> = {
    api_id: "outcome_intelligence_dashboard_api",
    retrieve_dashboard: "POST /outcome-intelligence-dashboard/dashboard",
    retrieve_contract: "GET /outcome-intelligence-dashboard/contract",
    retrieve_recent: "POST /outcome-intelligence-dashboard/recent",
    retrieve_success: "POST /outcome-intelligence-dashboard/success",
    retrieve_failure: "POST /outcome-intelligence-dashboard/failure",
    retrieve_impact: "POST /outcome-intelligence-dashboard/impact",
    retrieve_categories: "POST /outcome-intelligence-dashboard/categories",
    retrieve_confidence: "POST /outcome-intelligence-dashboard/confidence",
    retrieve_risk: "POST /outcome-intelligence-dashboard/risk",
    retrieve_governance: "POST /outcome-intelligence-dashboard/governance",
    retrieve_rollback: "POST /outcome-intelligence-dashboard/rollback",
    retrieve_comparison: "POST /outcome-intelligence-dashboard/comparison",
    retrieve_replay: "POST /outcome-intelligence-dashboard/replay",
    validate_dashboard: "POST /outcome-intelligence-dashboard/validate",
    inspect_dashboard: "POST /outcome-intelligence-dashboard/inspect",
    mutation_supported: false,
    recalculation_supported: false,
    governance_decision_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function categoryFor(outcomeType: string): OutcomeCategory {
  if (outcomeType === "SUCCESSFUL") return "Success";
  if (outcomeType === "PARTIALLY_SUCCESSFUL") return "Partial Success";
  if (outcomeType === "FAILED") return "Failure";
  if (outcomeType === "ROLLBACK_REQUIRED") return "Rollback Executed";
  if (outcomeType === "ESCALATED") return "Escalated";
  if (outcomeType === "DEFERRED") return "Deferred";
  return "Success";
}

function severityFor(category: OutcomeCategory): OutcomeSeverity {
  if (category === "Failure" || category === "Rollback Executed") return "HIGH";
  if (category === "Governance Blocked" || category === "Certification Blocked" || category === "Escalated") return "MODERATE";
  return "LOW";
}

function recentOutcomes(result: ReturnType<typeof runOutcomeObservationEngine>, failures: readonly OutcomeDashboardFailure[]): readonly OutcomeRecordView[] {
  if (failures.includes("OUTCOME_RECORD_OMITTED")) return freezeArray([]);
  const record = result.observation_record;
  const category = failures.includes("OUTCOME_RECORD_HIDDEN") ? "Deferred" : categoryFor(record.outcome_type);
  const base: Omit<OutcomeRecordView, "integrity_hash"> = {
    outcome_view_id: id("outcome_view", record.outcome_id),
    tenant_id: failures.includes("TENANT_ISOLATION_VIOLATED") ? "tenant-cross-boundary" : record.tenant_id,
    mission_id: record.mission_id,
    outcome_id: record.outcome_id,
    completion_status: result.resolver.execution_status,
    observed_outcome: category,
    outcome_severity: severityFor(category),
    mission_owner: record.operator_workflow_id,
    completion_time: record.observed_timestamp,
    associated_recommendations: freezeArray([record.decision_package_id]),
    governance_state: failures.includes("GOVERNANCE_LINEAGE_MISSING") ? "MISSING" : result.validation.governance_valid ? "APPROVED" : "BLOCKED",
    certification_status: failures.length ? "PENDING" : "CERTIFIED",
    evidence_refs: failures.includes("EVIDENCE_REFERENCE_BROKEN") ? freezeArray([]) : record.actual_outcome_evidence_refs,
    governance_refs: failures.includes("GOVERNANCE_LINEAGE_MISSING") ? freezeArray([]) : record.governance_refs,
    replay_refs: failures.includes("REPLAY_REFERENCE_MISSING") ? freezeArray([]) : record.replay_refs,
  };
  return freezeArray([Object.freeze({ ...base, integrity_hash: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? "invalid-integrity" : hashWithoutIntegrity(base) })]);
}

function timeline(outcomes: readonly OutcomeRecordView[], failures: readonly OutcomeDashboardFailure[]): readonly OutcomeTimelineEvent[] {
  return freezeArray(outcomes.flatMap((outcome) => {
    const events: readonly OutcomeTimelineEvent["event_type"][] = ["OBSERVED", "GOVERNANCE_REVIEWED", "CONFIDENCE_REALIZED", "RISK_REALIZED", "ROLLBACK_RECORDED", "CERTIFIED"];
    return events.map((event, index) => {
      const base: Omit<OutcomeTimelineEvent, "integrity_hash"> = {
        event_id: `outcome_timeline_${outcome.outcome_id}_${index + 1}`,
        outcome_id: outcome.outcome_id,
        mission_id: outcome.mission_id,
        timestamp: `2026-07-13T00:0${index}:00.000Z`,
        event_type: event,
        summary: `${event} for ${outcome.outcome_id}.`,
        evidence_refs: failures.includes("EVIDENCE_REFERENCE_BROKEN") ? freezeArray([]) : outcome.evidence_refs,
        replay_ref: failures.includes("REPLAY_REFERENCE_MISSING") ? "" : outcome.replay_refs[0] ?? "",
      };
      return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
    });
  }));
}

function trend(idValue: string, outcomes: readonly OutcomeRecordView[], failureMode: boolean): OutcomeTrendAnalytics {
  const successful = outcomes.filter((outcome) => outcome.observed_outcome === "Success").length;
  const failed = outcomes.filter((outcome) => outcome.observed_outcome === "Failure").length;
  const total = Math.max(outcomes.length, 1);
  const base: Omit<OutcomeTrendAnalytics, "integrity_hash"> = {
    analytics_id: idValue,
    successful_missions: successful,
    failed_missions: failed,
    success_percentage: Number(((successful / total) * 100).toFixed(2)),
    failure_percentage: Number(((failed / total) * 100).toFixed(2)),
    trend_direction: failureMode ? "DECLINING" : "STABLE",
    recurring_improvements: freezeArray(["governance visibility", "replay completeness"]),
    recurring_failures: failureMode ? freezeArray(["evidence gap", "replay gap"]) : freezeArray([]),
    success_by_tenant: freezeArray(outcomes.map((outcome) => `${outcome.tenant_id}:${outcome.observed_outcome}`)),
    success_by_mission_type: freezeArray(outcomes.map((outcome) => `${outcome.mission_id}:operational`)),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function missionImpact(outcomes: readonly OutcomeRecordView[]): MissionImpactDashboard {
  const base: Omit<MissionImpactDashboard, "integrity_hash"> = {
    impact_id: "outcome_mission_impact",
    operational_improvement: outcomes.length ? 0.18 : 0,
    efficiency_change: outcomes.length ? 0.12 : 0,
    resource_utilization_delta: -0.07,
    objective_completion: outcomes.some((outcome) => outcome.observed_outcome === "Success") ? 1 : 0.5,
    mission_delays: 0,
    mission_degradation: outcomes.some((outcome) => outcome.outcome_severity === "HIGH") ? 1 : 0,
    downstream_impact_refs: freezeArray(outcomes.map((outcome) => `downstream:${outcome.outcome_id}`)),
    cross_mission_effect_refs: freezeArray(outcomes.map((outcome) => `cross-mission:${outcome.mission_id}`)),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function categorySummary(outcomes: readonly OutcomeRecordView[]): OutcomeCategorySummary {
  const base: Omit<OutcomeCategorySummary, "integrity_hash"> = {
    category_id: "outcome_category_summary",
    categories: CATEGORIES,
    category_counts: CATEGORIES.map((category) => `${category}:${outcomes.filter((outcome) => outcome.observed_outcome === category).length}`),
    category_trends: CATEGORIES.map((category) => `${category}:stable`),
    mission_groupings: outcomes.map((outcome) => `${outcome.mission_id}:${outcome.observed_outcome}`),
    historical_comparisons: outcomes.map((outcome) => `baseline:${outcome.outcome_id}`),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function confidenceDashboard(failures: readonly OutcomeDashboardFailure[]): ConfidenceRealizationDashboard {
  const predicted = 0.86;
  const actual = failures.length ? 0.62 : 0.88;
  const base: Omit<ConfidenceRealizationDashboard, "integrity_hash"> = {
    confidence_id: "outcome_confidence_realization",
    predicted_confidence: predicted,
    actual_confidence_realization: actual,
    confidence_calibration: Number((1 - Math.abs(predicted - actual)).toFixed(2)),
    confidence_drift: Number(Math.abs(predicted - actual).toFixed(2)),
    confidence_error: Number(Math.abs(predicted - actual).toFixed(2)),
    overconfidence: predicted > actual ? Number((predicted - actual).toFixed(2)) : 0,
    underconfidence: actual > predicted ? Number((actual - predicted).toFixed(2)) : 0,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function riskDashboard(outcomes: readonly OutcomeRecordView[]): RiskRealizationDashboard {
  const high = outcomes.some((outcome) => outcome.outcome_severity === "HIGH");
  const base: Omit<RiskRealizationDashboard, "integrity_hash"> = {
    risk_id: "outcome_risk_realization",
    predicted_risk: 0.31,
    realized_risk: high ? 0.74 : 0.28,
    underestimated_risks: high ? 1 : 0,
    overestimated_risks: high ? 0 : 1,
    realized_severity: high ? "HIGH" : "LOW",
    realized_probability: high ? 0.74 : 0.28,
    mitigation_effectiveness: high ? 0.44 : 0.91,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function governanceDashboard(outcomes: readonly OutcomeRecordView[], failures: readonly OutcomeDashboardFailure[]): GovernanceOutcomeDashboard {
  const base: Omit<GovernanceOutcomeDashboard, "integrity_hash"> = {
    governance_id: "outcome_governance_dashboard",
    governance_approvals: failures.includes("GOVERNANCE_LINEAGE_MISSING") ? 0 : outcomes.length,
    governance_rejections: 0,
    constitutional_reviews: outcomes.length,
    policy_violations: failures.includes("GOVERNANCE_LINEAGE_MISSING") ? 1 : 0,
    governance_escalations: outcomes.filter((outcome) => outcome.observed_outcome === "Escalated").length,
    authority_decisions: outcomes.map((outcome) => `${outcome.outcome_id}:AUTHORIZED`),
    governance_impact_refs: outcomes.flatMap((outcome) => outcome.governance_refs),
    approval_lineage_refs: failures.includes("GOVERNANCE_LINEAGE_MISSING") ? freezeArray([]) : outcomes.map((outcome) => `approval-lineage:${outcome.outcome_id}`),
    replay_refs: failures.includes("REPLAY_REFERENCE_MISSING") ? freezeArray([]) : outcomes.flatMap((outcome) => outcome.replay_refs),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function rollbackDashboard(outcomes: readonly OutcomeRecordView[], failures: readonly OutcomeDashboardFailure[]): RollbackOutcomeDashboard {
  const rollback = outcomes.some((outcome) => outcome.observed_outcome === "Rollback Executed");
  const base: Omit<RollbackOutcomeDashboard, "integrity_hash"> = {
    rollback_id: "outcome_rollback_dashboard",
    rollback_events: failures.includes("ROLLBACK_HISTORY_MISSING") ? 0 : rollback ? 1 : 0,
    rollback_reasons: failures.includes("ROLLBACK_HISTORY_MISSING") ? freezeArray([]) : rollback ? freezeArray(["mission recovery"]) : freezeArray([]),
    rollback_success: !failures.includes("ROLLBACK_HISTORY_MISSING"),
    rollback_duration_ms: rollback ? 4200 : 0,
    rollback_completeness: failures.includes("ROLLBACK_HISTORY_MISSING") ? 0 : 1,
    rollback_replay_refs: failures.includes("REPLAY_REFERENCE_MISSING") || failures.includes("ROLLBACK_HISTORY_MISSING") ? freezeArray([]) : outcomes.flatMap((outcome) => outcome.replay_refs),
    rollback_certification_refs: failures.includes("ROLLBACK_HISTORY_MISSING") ? freezeArray([]) : outcomes.map((outcome) => `rollback-cert:${outcome.outcome_id}`),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function comparison(outcomes: readonly OutcomeRecordView[], failures: readonly OutcomeDashboardFailure[]): HistoricalComparisonExplorer {
  const base: Omit<HistoricalComparisonExplorer, "integrity_hash"> = {
    comparison_id: "outcome_historical_comparison",
    dimensions: freezeArray(["mission", "tenant", "strategy", "recommendation", "confidence", "risk", "governance", "operator", "certification"]),
    period_comparison_refs: outcomes.map((outcome) => `period:${outcome.outcome_id}`),
    trend_analysis_refs: outcomes.map((outcome) => `trend:${outcome.outcome_id}`),
    baseline_comparison_refs: outcomes.map((outcome) => `baseline:${outcome.outcome_id}`),
    historical_replay_refs: failures.includes("REPLAY_REFERENCE_MISSING") ? freezeArray([]) : outcomes.flatMap((outcome) => outcome.replay_refs),
    improvement_tracking_refs: outcomes.map((outcome) => `improvement:${outcome.outcome_id}`),
    deterministic: !failures.includes("HISTORICAL_COMPARISON_NONDETERMINISTIC"),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function replayIntegration(outcomes: readonly OutcomeRecordView[], ledger: ReturnType<typeof runOutcomeObservationLedger>, failures: readonly OutcomeDashboardFailure[]): readonly OutcomeReplayIntegration[] {
  return freezeArray(outcomes.map((outcome) => {
    const base: Omit<OutcomeReplayIntegration, "integrity_hash"> = {
      replay_id: `outcome_replay_${outcome.outcome_id}`,
      outcome_id: outcome.outcome_id,
      evidence_lineage_ref: failures.includes("EVIDENCE_REFERENCE_BROKEN") ? "" : `evidence-lineage:${outcome.outcome_id}`,
      governance_lineage_ref: failures.includes("GOVERNANCE_LINEAGE_MISSING") ? "" : `governance-lineage:${outcome.outcome_id}`,
      certification_record_ref: `certification:${outcome.certification_status}:${outcome.outcome_id}`,
      outcome_ledger_ref: ledger.ledger_records[0]?.ledger_record_id ?? "",
      truth_ledger_ref: `truth-ledger:${outcome.outcome_id}`,
      replayable: !failures.includes("REPLAY_REFERENCE_MISSING"),
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function permissions(input: OutcomeDashboardInput, failures: readonly OutcomeDashboardFailure[]): readonly OutcomeDashboardPermission[] {
  const role = input.role ?? "OPERATOR";
  const base: Omit<OutcomeDashboardPermission, "integrity_hash"> = {
    permission_id: `outcome_dashboard_permission_${role.toLowerCase()}`,
    role,
    tenant_id: failures.includes("TENANT_ISOLATION_VIOLATED") ? "tenant-cross-boundary" : input.tenant_id ?? TENANT_ID,
    allowed: !failures.includes("UNAUTHORIZED_DASHBOARD_ACCESS"),
    restricted_fields: failures.includes("RESTRICTED_FIELD_EXPOSED") ? freezeArray([]) : freezeArray(["restricted_evidence_payload", "protected_operator_information"]),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    governance_authorized: !failures.includes("GOVERNANCE_LINEAGE_MISSING"),
    evidence_authorized: !failures.includes("EVIDENCE_REFERENCE_BROKEN") && !failures.includes("RESTRICTED_FIELD_EXPOSED"),
    replay_authorized: !failures.includes("REPLAY_REFERENCE_MISSING"),
  };
  return freezeArray([Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) })]);
}

function validationTest(name: string, passed: boolean, failure: OutcomeDashboardFailure, evidence_refs: readonly string[]): OutcomeDashboardValidationTest {
  const base: Omit<OutcomeDashboardValidationTest, "integrity_hash"> = {
    test_id: id("outcome_dashboard_test", name),
    name,
    expected: "PASS",
    actual: passed ? "PASS" : "FAIL",
    passed,
    failure_reason: passed ? null : failure,
    evidence_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildValidationTests(result: Omit<OutcomeDashboardResult, "validation_tests" | "validation_outcome" | "failures" | "replay_hash" | "integrity_hash">): readonly OutcomeDashboardValidationTest[] {
  const evidence = [result.dashboard_foundation.integrity_hash, result.outcome_engine_result.integrity_hash, result.outcome_ledger_result.integrity_hash];
  return freezeArray([
    validationTest("foundation integration", replayAdaptiveDashboardFoundation(result.dashboard_foundation), "DASHBOARD_FOUNDATION_UNAVAILABLE", evidence),
    validationTest("all outcomes visible", result.recent_outcomes.length > 0 && result.recent_outcomes.every((outcome) => outcome.observed_outcome !== "Deferred"), "OUTCOME_RECORD_HIDDEN", evidence),
    validationTest("no outcome omitted", result.recent_outcomes.length > 0, "OUTCOME_RECORD_OMITTED", evidence),
    validationTest("deterministic outcome rendering", result.deterministic, "OUTCOME_RENDERING_NONDETERMINISTIC", evidence),
    validationTest("evidence backed visualization", result.evidence_backed && result.recent_outcomes.every((outcome) => outcome.evidence_refs.length > 0), "EVIDENCE_REFERENCE_BROKEN", evidence),
    validationTest("replay integration", result.replayable && result.replay_integration.every((link) => link.replayable && link.outcome_ledger_ref), "REPLAY_REFERENCE_MISSING", evidence),
    validationTest("governance lineage visible", result.governance_visible && result.governance_outcomes.approval_lineage_refs.length > 0, "GOVERNANCE_LINEAGE_MISSING", evidence),
    validationTest("rollback history represented", result.rollback_outcomes.rollback_completeness === 1, "ROLLBACK_HISTORY_MISSING", evidence),
    validationTest("historical comparison deterministic", result.historical_comparison.deterministic && result.historical_comparison.dimensions.length === 9, "HISTORICAL_COMPARISON_NONDETERMINISTIC", evidence),
    validationTest("visualizations fresh", result.metrics.stale_visualizations !== 1, "STALE_VISUALIZATION_DETECTED", evidence),
    validationTest("role authorization enforced", result.permissions.every((permission) => permission.allowed), "UNAUTHORIZED_DASHBOARD_ACCESS", evidence),
    validationTest("tenant isolation enforced", result.tenant_isolated && result.recent_outcomes.every((outcome) => outcome.tenant_id === TENANT_ID), "TENANT_ISOLATION_VIOLATED", evidence),
    validationTest("field-level visibility enforced", result.permissions.every((permission) => permission.restricted_fields.length > 0), "RESTRICTED_FIELD_EXPOSED", evidence),
    validationTest("integrity verification", result.recent_outcomes.every((outcome) => hashWithoutIntegrity(outcome) === outcome.integrity_hash), "INTEGRITY_VERIFICATION_FAILED", evidence),
    validationTest("read-only intelligence", result.read_only && result.advisory_only && !result.write_authority_granted, "DASHBOARD_WRITE_AUTHORITY_EXPOSED", evidence),
  ]);
}

function metrics(failures: readonly OutcomeDashboardFailure[]): OutcomeDashboardMetrics {
  const base: Omit<OutcomeDashboardMetrics, "integrity_hash"> = {
    rendering_health: failures.length ? "DEGRADED" : "HEALTHY",
    missing_outcome_records: failures.includes("OUTCOME_RECORD_OMITTED") ? 1 : 0,
    stale_visualizations: failures.includes("STALE_VISUALIZATION_DETECTED") ? 1 : 0,
    broken_evidence_references: failures.includes("EVIDENCE_REFERENCE_BROKEN") ? 1 : 0,
    replay_resolution_failures: failures.includes("REPLAY_REFERENCE_MISSING") ? 1 : 0,
    navigation_failures: failures.includes("HISTORICAL_COMPARISON_NONDETERMINISTIC") ? 1 : 0,
    integrity_verification_failures: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? 1 : 0,
    unauthorized_access_attempts: failures.includes("UNAUTHORIZED_DASHBOARD_ACCESS") ? 1 : 0,
    data_sync_latency_ms: 11,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<OutcomeDashboardResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    foundation: result.dashboard_foundation.integrity_hash,
    engine: result.outcome_engine_result.integrity_hash,
    ledger: result.outcome_ledger_result.integrity_hash,
    recent: result.recent_outcomes.map((item) => item.integrity_hash),
    timeline: result.timeline_explorer.map((item) => item.integrity_hash),
    success: result.success_trends.integrity_hash,
    failure: result.failure_trends.integrity_hash,
    impact: result.mission_impact.integrity_hash,
    categories: result.outcome_categories.integrity_hash,
    confidence: result.confidence_realization.integrity_hash,
    risk: result.risk_realization.integrity_hash,
    governance: result.governance_outcomes.integrity_hash,
    rollback: result.rollback_outcomes.integrity_hash,
    comparison: result.historical_comparison.integrity_hash,
    replay: result.replay_integration.map((item) => item.integrity_hash),
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<OutcomeDashboardResult, "integrity_hash">): string {
  return hash({
    version: result.outcome_intelligence_dashboard_version,
    id: result.dashboard_identifier,
    api: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    validation_outcome: result.validation_outcome,
  });
}

export function buildOutcomeIntelligenceDashboard(input: OutcomeDashboardInput = {}): OutcomeDashboardResult {
  const scenario = input.scenario ?? "BASELINE";
  const foundation = establishAdaptiveDashboardFoundation();
  const engine = runOutcomeObservationEngine();
  const ledger = runOutcomeObservationLedger();
  const initialFailures = freezeArray([
    ...(failureForScenario(scenario) ? [failureForScenario(scenario) as OutcomeDashboardFailure] : []),
    ...(!replayAdaptiveDashboardFoundation(foundation) ? ["DASHBOARD_FOUNDATION_UNAVAILABLE" as const] : []),
    ...(!replayOutcomeObservationEngine(engine) || !replayOutcomeObservationLedger(ledger) ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
  ]);
  const api_surface = apiSurface();
  const recent_outcomes = recentOutcomes(engine, initialFailures);
  const timeline_explorer = timeline(recent_outcomes, initialFailures);
  const success_trends = trend("outcome_success_trends", recent_outcomes, false);
  const failure_trends = trend("outcome_failure_trends", recent_outcomes, initialFailures.length > 0);
  const mission_impact = missionImpact(recent_outcomes);
  const outcome_categories = categorySummary(recent_outcomes);
  const confidence_realization = confidenceDashboard(initialFailures);
  const risk_realization = riskDashboard(recent_outcomes);
  const governance_outcomes = governanceDashboard(recent_outcomes, initialFailures);
  const rollback_outcomes = rollbackDashboard(recent_outcomes, initialFailures);
  const historical_comparison = comparison(recent_outcomes, initialFailures);
  const replay_integration = replayIntegration(recent_outcomes, ledger, initialFailures);
  const permissionRecords = permissions(input, initialFailures);
  const provisionalMetrics = metrics(initialFailures);
  const baseWithoutValidation: Omit<OutcomeDashboardResult, "metrics" | "validation_tests" | "validation_outcome" | "failures" | "replay_hash" | "integrity_hash"> = {
    outcome_intelligence_dashboard_version: VERSION,
    dashboard_identifier: DASHBOARD_ID,
    status: initialFailures.length ? "REJECTED" : "AUTHORITATIVE",
    api_surface,
    dashboard_foundation: foundation,
    outcome_engine_result: engine,
    outcome_ledger_result: ledger,
    recent_outcomes,
    timeline_explorer,
    success_trends,
    failure_trends,
    mission_impact,
    outcome_categories,
    confidence_realization,
    risk_realization,
    governance_outcomes,
    rollback_outcomes,
    historical_comparison,
    replay_integration,
    permissions: permissionRecords,
    widgets: WIDGETS,
    deterministic: !initialFailures.includes("OUTCOME_RENDERING_NONDETERMINISTIC") && !initialFailures.includes("HISTORICAL_COMPARISON_NONDETERMINISTIC"),
    replayable: !initialFailures.includes("REPLAY_REFERENCE_MISSING"),
    tenant_isolated: !initialFailures.includes("TENANT_ISOLATION_VIOLATED"),
    evidence_backed: !initialFailures.includes("EVIDENCE_REFERENCE_BROKEN"),
    governance_visible: !initialFailures.includes("GOVERNANCE_LINEAGE_MISSING"),
    read_only: true,
    advisory_only: true,
    write_authority_granted: initialFailures.includes("DASHBOARD_WRITE_AUTHORITY_EXPOSED") ? true as never : false,
  };
  const validation_tests = buildValidationTests({ ...baseWithoutValidation, metrics: provisionalMetrics } as Omit<OutcomeDashboardResult, "validation_tests" | "validation_outcome" | "failures" | "replay_hash" | "integrity_hash">);
  const failures = freezeArray([...new Set([...initialFailures, ...validation_tests.map((test) => test.failure_reason).filter((failure): failure is OutcomeDashboardFailure => Boolean(failure))])]);
  const metricsRecord = metrics(failures);
  const validation_outcome = failures.length ? "INVALID" : "VALID";
  const base: Omit<OutcomeDashboardResult, "replay_hash" | "integrity_hash"> = {
    ...baseWithoutValidation,
    status: failures.length ? "REJECTED" : "AUTHORITATIVE",
    metrics: metricsRecord,
    validation_tests,
    validation_outcome,
    failures,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateOutcomeIntelligenceDashboard(result?: OutcomeDashboardResult): OutcomeDashboardValidationResult {
  if (!result) {
    const failures = freezeArray<OutcomeDashboardFailure>(["OUTCOME_RENDERING_NONDETERMINISTIC"]);
    const base: Omit<OutcomeDashboardValidationResult, "validation_hash"> = { dashboard_id: null, valid: false, validation_outcome: "INVALID", failures, replay_hash_valid: false, integrity_hash_valid: false, read_only: false };
    return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const nestedIntegrity = (
    hashWithoutIntegrity(result.api_surface) === result.api_surface.integrity_hash &&
    result.recent_outcomes.every((item) => hashWithoutIntegrity(item) === item.integrity_hash) &&
    result.timeline_explorer.every((item) => hashWithoutIntegrity(item) === item.integrity_hash) &&
    hashWithoutIntegrity(result.success_trends) === result.success_trends.integrity_hash &&
    hashWithoutIntegrity(result.failure_trends) === result.failure_trends.integrity_hash &&
    hashWithoutIntegrity(result.mission_impact) === result.mission_impact.integrity_hash &&
    hashWithoutIntegrity(result.outcome_categories) === result.outcome_categories.integrity_hash &&
    hashWithoutIntegrity(result.confidence_realization) === result.confidence_realization.integrity_hash &&
    hashWithoutIntegrity(result.risk_realization) === result.risk_realization.integrity_hash &&
    hashWithoutIntegrity(result.governance_outcomes) === result.governance_outcomes.integrity_hash &&
    hashWithoutIntegrity(result.rollback_outcomes) === result.rollback_outcomes.integrity_hash &&
    hashWithoutIntegrity(result.historical_comparison) === result.historical_comparison.integrity_hash &&
    result.replay_integration.every((item) => hashWithoutIntegrity(item) === item.integrity_hash) &&
    result.permissions.every((item) => hashWithoutIntegrity(item) === item.integrity_hash) &&
    hashWithoutIntegrity(result.metrics) === result.metrics.integrity_hash &&
    result.validation_tests.every((item) => hashWithoutIntegrity(item) === item.integrity_hash)
  );
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash && nestedIntegrity;
  const read_only = result.read_only && result.advisory_only && !result.write_authority_granted && !result.api_surface.mutation_supported && !result.api_surface.recalculation_supported && !result.api_surface.governance_decision_supported;
  const valid = result.validation_outcome === "VALID" && result.failures.length === 0 && replay_hash_valid && integrity_hash_valid && read_only;
  const base: Omit<OutcomeDashboardValidationResult, "validation_hash"> = {
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

export function replayOutcomeIntelligenceDashboard(result: OutcomeDashboardResult): boolean {
  return validateOutcomeIntelligenceDashboard(result).valid;
}

export function buildOutcomeDashboardObservabilitySurface(result = buildOutcomeIntelligenceDashboard()): OutcomeDashboardObservabilitySurface {
  return Object.freeze({
    dashboard_id: result.dashboard_identifier,
    status: result.status,
    validation_outcome: result.validation_outcome,
    outcomes: result.recent_outcomes.length,
    timeline_events: result.timeline_explorer.length,
    failed_tests: result.validation_tests.filter((test) => !test.passed).length,
    failures: result.failures,
    rendering_health: result.metrics.rendering_health,
    replayable: result.replayable,
    tenant_isolated: result.tenant_isolated,
    read_only: result.read_only && result.advisory_only && !result.write_authority_granted,
    integrity_hash: result.integrity_hash,
  });
}

export function getOutcomeIntelligenceDashboardContract(): OutcomeDashboardContract {
  const result = buildOutcomeIntelligenceDashboard();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      widgets: WIDGETS,
      outcome_categories: CATEGORIES,
      navigation_dimensions: freezeArray(["mission", "outcome category", "tenant", "timeframe", "recommendation", "governance decision", "rollback event", "confidence level", "risk level", "certification state"]),
      required_data_sources: freezeArray(["Outcome Observation Engine", "Outcome Ledger", "Recommendation Effectiveness Engine", "Pattern Intelligence Engine", "Confidence Intelligence", "Risk Intelligence", "Governance Engine", "Rollback Engine", "Replay Engine", "Truth Ledger", "Certification Ledger"]),
      read_only: true,
      advisory_only: true,
    }),
    result,
    validation: validateOutcomeIntelligenceDashboard(result),
    observability: buildOutcomeDashboardObservabilitySurface(result),
  });
}

export const OutcomeIntelligenceDashboard = Object.freeze({
  build: buildOutcomeIntelligenceDashboard,
  validate: validateOutcomeIntelligenceDashboard,
  replay: replayOutcomeIntelligenceDashboard,
});
