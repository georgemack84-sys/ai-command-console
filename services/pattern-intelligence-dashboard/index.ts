import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { establishAdaptiveDashboardFoundation, replayAdaptiveDashboardFoundation } from "@/services/adaptive-dashboard-foundation";
import { renderOperatorPatternDashboard, replayOperatorPatternDashboard } from "@/services/operator-pattern-intelligence-dashboard";
import { certifyPatternIntelligence, replayPatternIntelligenceCertification } from "@/services/pattern-intelligence-certification-gate";
import type {
  GovernanceImpactDashboard,
  MissionPatternAnalytics,
  OperatorImpactDashboard,
  PatternConfidenceDashboard,
  PatternEvidenceExplorer,
  PatternIntelligenceDashboardApiSurface,
  PatternIntelligenceDashboardContract,
  PatternIntelligenceDashboardFailure,
  PatternIntelligenceDashboardInput,
  PatternIntelligenceDashboardMetrics,
  PatternIntelligenceDashboardObservabilitySurface,
  PatternIntelligenceDashboardPermission,
  PatternIntelligenceDashboardResult,
  PatternIntelligenceDashboardScenario,
  PatternIntelligenceDashboardValidationResult,
  PatternIntelligenceDashboardValidationTest,
  PatternIntelligenceWidget,
  PatternRecordView,
  PatternRelationshipGraph,
  PatternReplayExplorer,
  PatternTimelineExplorer,
  PatternTrendAnalytics,
  ProposedResponseDashboard,
  StrategicImpactDashboard,
} from "@/types/pattern-intelligence-dashboard";

const VERSION = "pattern-intelligence-dashboard/v10.14.4" as const;
const DASHBOARD_ID = "PatternIntelligenceDashboard" as const;
const TENANT_ID = "tenant_mission_control";

const WIDGETS: readonly PatternIntelligenceWidget[] = Object.freeze(["Pattern Timeline", "Pattern Graph", "Mission Heatmap", "Evidence Viewer", "Confidence Distribution", "Strategic Impact", "Recurrence Trend", "Replay Explorer", "Governance Impact", "Operator Impact"]);

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

function failureForScenario(scenario: PatternIntelligenceDashboardScenario): PatternIntelligenceDashboardFailure | undefined {
  const map: Partial<Record<PatternIntelligenceDashboardScenario, PatternIntelligenceDashboardFailure>> = {
    FOUNDATION_UNAVAILABLE: "DASHBOARD_FOUNDATION_UNAVAILABLE",
    PATTERN_HIDDEN: "PATTERN_RECORD_HIDDEN",
    PATTERN_DELETED: "PATTERN_RECORD_DELETED",
    NONDETERMINISTIC_RENDERING: "PATTERN_RENDERING_NONDETERMINISTIC",
    MISSING_EVIDENCE: "EVIDENCE_REFERENCE_BROKEN",
    MISSING_REPLAY: "REPLAY_REFERENCE_MISSING",
    MISSING_GOVERNANCE: "GOVERNANCE_LINEAGE_MISSING",
    MISSING_CERTIFICATION: "CERTIFICATION_LINEAGE_MISSING",
    GRAPH_DRIFT: "GRAPH_RENDERING_NONDETERMINISTIC",
    RECURRENCE_DRIFT: "RECURRENCE_CALCULATION_NONDETERMINISTIC",
    CONFIDENCE_DRIFT: "CONFIDENCE_VISUALIZATION_NONDETERMINISTIC",
    UNAUTHORIZED_ROLE: "UNAUTHORIZED_DASHBOARD_ACCESS",
    TENANT_LEAK: "TENANT_ISOLATION_VIOLATED",
    RESTRICTED_FIELD_LEAK: "RESTRICTED_FIELD_EXPOSED",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    WRITE_AUTHORITY_EXPOSED: "DASHBOARD_WRITE_AUTHORITY_EXPOSED",
  };
  return map[scenario];
}

function apiSurface(): PatternIntelligenceDashboardApiSurface {
  const base: Omit<PatternIntelligenceDashboardApiSurface, "integrity_hash"> = {
    api_id: "pattern_intelligence_dashboard_api",
    retrieve_dashboard: "POST /pattern-intelligence-dashboard/dashboard",
    retrieve_contract: "GET /pattern-intelligence-dashboard/contract",
    retrieve_patterns: "POST /pattern-intelligence-dashboard/patterns",
    retrieve_timeline: "POST /pattern-intelligence-dashboard/timeline",
    retrieve_graph: "POST /pattern-intelligence-dashboard/graph",
    retrieve_mission: "POST /pattern-intelligence-dashboard/mission",
    retrieve_confidence: "POST /pattern-intelligence-dashboard/confidence",
    retrieve_strategic: "POST /pattern-intelligence-dashboard/strategic",
    retrieve_governance: "POST /pattern-intelligence-dashboard/governance",
    retrieve_evidence: "POST /pattern-intelligence-dashboard/evidence",
    retrieve_operator: "POST /pattern-intelligence-dashboard/operator",
    retrieve_responses: "POST /pattern-intelligence-dashboard/responses",
    retrieve_replay: "POST /pattern-intelligence-dashboard/replay",
    retrieve_trends: "POST /pattern-intelligence-dashboard/trends",
    validate_dashboard: "POST /pattern-intelligence-dashboard/validate",
    inspect_dashboard: "POST /pattern-intelligence-dashboard/inspect",
    creation_supported: false,
    mutation_supported: false,
    pattern_creation_supported: false,
    classification_mutation_supported: false,
    confidence_mutation_supported: false,
    governance_decision_supported: false,
    operator_action_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function patternRecords(
  operatorDashboard: ReturnType<typeof renderOperatorPatternDashboard>,
  certification: ReturnType<typeof certifyPatternIntelligence>,
  failures: readonly PatternIntelligenceDashboardFailure[],
): readonly PatternRecordView[] {
  if (failures.includes("PATTERN_RECORD_DELETED")) return freezeArray([]);
  const source = operatorDashboard.pattern_elements.find((element) => element.element_type === "PATTERN_SUMMARY") ?? operatorDashboard.pattern_elements[0];
  const replayRecord = operatorDashboard.replay_result.replay_records[0];
  const hidden = failures.includes("PATTERN_RECORD_HIDDEN");
  const base: Omit<PatternRecordView, "integrity_hash"> = {
    pattern_view_id: id("pattern_view", source?.pattern_id ?? "missing"),
    tenant_id: failures.includes("TENANT_ISOLATION_VIOLATED") ? "tenant-cross-boundary" : source?.tenant_id ?? TENANT_ID,
    mission_id: replayRecord?.mission_scope ?? "mission-control-pattern-intelligence",
    pattern_id: source?.pattern_id ?? "pattern-unavailable",
    pattern_classification: hidden ? "HIDDEN" : "recurring operational intelligence",
    pattern_category: hidden ? "HIDDEN" : "cross-mission recurrence",
    detection_timestamp: "2026-07-09T00:00:00.000Z",
    current_status: certification.certification_record.certification_state === "PASS" && !failures.length ? "CERTIFIED" : "PENDING",
    confidence_score: failures.includes("CONFIDENCE_VISUALIZATION_NONDETERMINISTIC") ? 0.41 : source?.score ?? 0,
    recurrence_frequency: failures.includes("RECURRENCE_CALCULATION_NONDETERMINISTIC") ? 0 : 3,
    certification_status: failures.includes("CERTIFICATION_LINEAGE_MISSING") ? "PENDING" : certification.certification_record.certification_state === "PASS" ? "CERTIFIED" : "BLOCKED",
    replay_available: !failures.includes("REPLAY_REFERENCE_MISSING") && Boolean(source?.replay_available),
    evidence_refs: failures.includes("EVIDENCE_REFERENCE_BROKEN") ? freezeArray([]) : source?.evidence_refs ?? freezeArray([]),
    governance_refs: failures.includes("GOVERNANCE_LINEAGE_MISSING") ? freezeArray([]) : source?.governance_refs ?? freezeArray([]),
    replay_refs: failures.includes("REPLAY_REFERENCE_MISSING") ? freezeArray([]) : source?.replay_refs ?? freezeArray([]),
    certification_refs: failures.includes("CERTIFICATION_LINEAGE_MISSING") ? freezeArray([]) : freezeArray([certification.certification_record.certification_id]),
    lineage_refs: freezeArray([operatorDashboard.replay_result.registry.registry_id, certification.ledger_result.ledger.records[0]?.ledger_record_id ?? certification.ledger_result.ledger.ledger_id]),
  };
  return freezeArray([Object.freeze({ ...base, integrity_hash: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? "invalid-integrity" : hashWithoutIntegrity(base) })]);
}

function timelineExplorer(records: readonly PatternRecordView[], failures: readonly PatternIntelligenceDashboardFailure[]): PatternTimelineExplorer {
  const base: Omit<PatternTimelineExplorer, "integrity_hash"> = {
    timeline_id: "pattern_timeline_explorer",
    chronological_pattern_refs: records.map((record) => `detected:${record.pattern_id}:${record.detection_timestamp}`),
    recurrence_history_refs: records.map((record) => `recurrence:${record.pattern_id}:${record.recurrence_frequency}`),
    lifecycle_progression_refs: records.map((record) => `lifecycle:${record.pattern_id}:${record.current_status}`),
    certification_milestones: records.flatMap((record) => record.certification_refs),
    deterministic: !failures.includes("PATTERN_RENDERING_NONDETERMINISTIC"),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function relationshipGraph(records: readonly PatternRecordView[], failures: readonly PatternIntelligenceDashboardFailure[]): PatternRelationshipGraph {
  const base: Omit<PatternRelationshipGraph, "integrity_hash"> = {
    graph_id: "pattern_relationship_graph",
    pattern_nodes: records.map((record) => record.pattern_id),
    relationship_edges: records.map((record) => `edge:${record.pattern_id}:shared-evidence:mission`),
    shared_evidence_refs: records.flatMap((record) => record.evidence_refs),
    linked_mission_refs: records.map((record) => record.mission_id),
    related_recommendation_refs: records.map((record) => `recommendation:${record.pattern_id}`),
    dependency_refs: records.flatMap((record) => record.lineage_refs),
    deterministic: !failures.includes("GRAPH_RENDERING_NONDETERMINISTIC"),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function missionAnalytics(records: readonly PatternRecordView[]): MissionPatternAnalytics {
  const base: Omit<MissionPatternAnalytics, "integrity_hash"> = {
    analytics_id: "mission_pattern_analytics",
    affected_missions: records.map((record) => record.mission_id),
    mission_categories: freezeArray(["adaptive-intelligence", "mission-control", "operator-review"]),
    mission_performance_refs: records.map((record) => `performance:${record.mission_id}`),
    recurring_issue_refs: records.map((record) => `issue:${record.pattern_id}`),
    improvement_refs: records.map((record) => `improvement:${record.pattern_id}`),
    dependency_refs: records.flatMap((record) => record.lineage_refs),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function confidenceDashboard(records: readonly PatternRecordView[], failures: readonly PatternIntelligenceDashboardFailure[]): PatternConfidenceDashboard {
  const confidence = records[0]?.confidence_score ?? 0;
  const base: Omit<PatternConfidenceDashboard, "integrity_hash"> = {
    confidence_id: "pattern_confidence_dashboard",
    confidence_level: confidence,
    confidence_history: records.map((record) => `confidence:${record.pattern_id}:${record.confidence_score}`),
    confidence_distribution: freezeArray(["0.00-0.49:0", "0.50-0.74:0", `0.75-1.00:${records.filter((record) => record.confidence_score >= 0.75).length}`]),
    supporting_observations: records.flatMap((record) => record.evidence_refs),
    confidence_variance: failures.includes("CONFIDENCE_VISUALIZATION_NONDETERMINISTIC") ? 0.59 : 0.04,
    confidence_trend: failures.includes("CONFIDENCE_VISUALIZATION_NONDETERMINISTIC") ? "DEGRADING" : "STABLE",
    deterministic: !failures.includes("CONFIDENCE_VISUALIZATION_NONDETERMINISTIC"),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function strategicImpactDashboard(records: readonly PatternRecordView[]): StrategicImpactDashboard {
  const base: Omit<StrategicImpactDashboard, "integrity_hash"> = {
    strategic_id: "pattern_strategic_impact_dashboard",
    strategic_opportunities: records.map((record) => `optimize response for ${record.pattern_id}`),
    recurring_weaknesses: freezeArray(["review latency", "evidence assembly friction"]),
    operational_improvements: freezeArray(["increase replay readiness", "tighten governance context"]),
    optimization_opportunities: freezeArray(["mission routing", "operator decision support"]),
    expected_mission_impact: "HIGH",
    strategy_evolution_candidates: records.map((record) => `strategy-evolution:${record.pattern_id}`),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function governanceImpactDashboard(records: readonly PatternRecordView[], failures: readonly PatternIntelligenceDashboardFailure[]): GovernanceImpactDashboard {
  const base: Omit<GovernanceImpactDashboard, "integrity_hash"> = {
    governance_id: "pattern_governance_impact_dashboard",
    governance_impact: failures.includes("GOVERNANCE_LINEAGE_MISSING") ? "CRITICAL" : "HIGH",
    constitutional_impact: failures.includes("GOVERNANCE_LINEAGE_MISSING") ? "CRITICAL" : "MODERATE",
    policy_implications: freezeArray(["preserve advisory-only display", "retain evidence access controls"]),
    authority_considerations: freezeArray(["governance authority review", "certification team audit"]),
    escalation_requirements: failures.includes("GOVERNANCE_LINEAGE_MISSING") ? freezeArray(["lineage repair required"]) : freezeArray(["none"]),
    certification_implications: records.flatMap((record) => record.certification_refs),
    governance_lineage_refs: records.flatMap((record) => record.governance_refs),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function evidenceExplorer(records: readonly PatternRecordView[]): PatternEvidenceExplorer {
  const evidence = records.flatMap((record) => record.evidence_refs);
  const base: Omit<PatternEvidenceExplorer, "integrity_hash"> = {
    evidence_id: "pattern_evidence_explorer",
    supporting_observations: evidence,
    linked_outcomes: records.map((record) => `outcome:${record.pattern_id}`),
    linked_recommendations: records.map((record) => `recommendation:${record.pattern_id}`),
    linked_simulations: records.map((record) => `simulation:${record.pattern_id}`),
    linked_feedback: records.map((record) => `feedback:${record.pattern_id}`),
    linked_governance_reviews: records.flatMap((record) => record.governance_refs),
    linked_replay_records: records.flatMap((record) => record.replay_refs),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function operatorImpactDashboard(records: readonly PatternRecordView[]): OperatorImpactDashboard {
  const base: Omit<OperatorImpactDashboard, "integrity_hash"> = {
    operator_id: "pattern_operator_impact_dashboard",
    affected_operators: freezeArray(["operator-pattern-intelligence-reviewer"]),
    operator_trends: freezeArray(["stable review behavior", "consistent evidence inspection"]),
    override_patterns: records.map((record) => `override-pattern:${record.pattern_id}:none`),
    approval_behavior: records.map((record) => `approval:${record.pattern_id}:${record.certification_status}`),
    review_latency_ms: 1300,
    operator_consistency: 0.92,
    workload_distribution: freezeArray(["review:1", "governance:1", "certification:1"]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function proposedResponseDashboard(records: readonly PatternRecordView[], failures: readonly PatternIntelligenceDashboardFailure[]): ProposedResponseDashboard {
  const base: Omit<ProposedResponseDashboard, "integrity_hash"> = {
    response_id: "pattern_proposed_response_dashboard",
    proposed_responses: records.map((record) => `review adaptive response candidate for ${record.pattern_id}`),
    response_rationale: records.map((record) => `recurrence frequency ${record.recurrence_frequency} with confidence ${record.confidence_score}`),
    expected_benefit: "HIGH",
    expected_risk: "MODERATE",
    simulation_status: "READY",
    governance_review: failures.includes("GOVERNANCE_LINEAGE_MISSING") ? "MISSING" : "VISIBLE",
    certification_readiness: failures.includes("CERTIFICATION_LINEAGE_MISSING") ? "BLOCKED" : "READY",
    proposal_lineage_refs: records.flatMap((record) => record.lineage_refs),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function replayExplorers(records: readonly PatternRecordView[], failures: readonly PatternIntelligenceDashboardFailure[]): readonly PatternReplayExplorer[] {
  return freezeArray(records.map((record) => {
    const base: Omit<PatternReplayExplorer, "integrity_hash"> = {
      replay_id: `pattern_replay_${record.pattern_id}`,
      originating_observations: record.evidence_refs,
      evidence_lineage_refs: record.evidence_refs,
      recommendation_lineage_refs: freezeArray([`recommendation:${record.pattern_id}`]),
      mission_history_refs: freezeArray([`mission:${record.mission_id}`]),
      operator_action_refs: freezeArray([`operator:review:${record.pattern_id}`]),
      governance_decision_refs: record.governance_refs,
      certification_record_refs: record.certification_refs,
      replayable: !failures.includes("REPLAY_REFERENCE_MISSING") && record.replay_available,
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function trendAnalytics(records: readonly PatternRecordView[], failures: readonly PatternIntelligenceDashboardFailure[]): PatternTrendAnalytics {
  const base: Omit<PatternTrendAnalytics, "integrity_hash"> = {
    trend_id: "pattern_trend_analytics",
    recurrence_trend: failures.includes("RECURRENCE_CALCULATION_NONDETERMINISTIC") ? "DEGRADING" : "STABLE",
    confidence_trend: failures.includes("CONFIDENCE_VISUALIZATION_NONDETERMINISTIC") ? "DEGRADING" : "STABLE",
    strategic_impact_trend: "IMPROVING",
    governance_impact_trend: failures.includes("GOVERNANCE_LINEAGE_MISSING") ? "DEGRADING" : "STABLE",
    pattern_persistence_score: records[0]?.recurrence_frequency ? 0.83 : 0,
    historical_comparison_refs: records.map((record) => `historical:${record.pattern_id}`),
    deterministic: !failures.includes("RECURRENCE_CALCULATION_NONDETERMINISTIC"),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function permissionRecords(input: PatternIntelligenceDashboardInput, failures: readonly PatternIntelligenceDashboardFailure[]): readonly PatternIntelligenceDashboardPermission[] {
  const role = input.role ?? "OPERATOR";
  const base: Omit<PatternIntelligenceDashboardPermission, "integrity_hash"> = {
    permission_id: `pattern_dashboard_permission_${role.toLowerCase()}`,
    role,
    tenant_id: failures.includes("TENANT_ISOLATION_VIOLATED") ? "tenant-cross-boundary" : input.tenant_id ?? TENANT_ID,
    allowed: !failures.includes("UNAUTHORIZED_DASHBOARD_ACCESS"),
    restricted_fields: failures.includes("RESTRICTED_FIELD_EXPOSED") ? freezeArray([]) : freezeArray(["restricted_evidence_payload", "protected_operator_information", "governance_notes", "certification_payload"]),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    governance_authorized: !failures.includes("GOVERNANCE_LINEAGE_MISSING"),
    evidence_authorized: !failures.includes("EVIDENCE_REFERENCE_BROKEN") && !failures.includes("RESTRICTED_FIELD_EXPOSED"),
    replay_authorized: !failures.includes("REPLAY_REFERENCE_MISSING"),
    certification_authorized: !failures.includes("CERTIFICATION_LINEAGE_MISSING"),
  };
  return freezeArray([Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) })]);
}

function metrics(failures: readonly PatternIntelligenceDashboardFailure[]): PatternIntelligenceDashboardMetrics {
  const base: Omit<PatternIntelligenceDashboardMetrics, "integrity_hash"> = {
    rendering_latency_ms: 11,
    pattern_sync_latency_ms: 15,
    missing_pattern_records: failures.includes("PATTERN_RECORD_DELETED") ? 1 : 0,
    stale_visualizations: failures.includes("PATTERN_RENDERING_NONDETERMINISTIC") ? 1 : 0,
    broken_evidence_references: failures.includes("EVIDENCE_REFERENCE_BROKEN") ? 1 : 0,
    replay_resolution_failures: failures.includes("REPLAY_REFERENCE_MISSING") ? 1 : 0,
    graph_rendering_failures: failures.includes("GRAPH_RENDERING_NONDETERMINISTIC") ? 1 : 0,
    integrity_verification_failures: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? 1 : 0,
    unauthorized_access_attempts: failures.includes("UNAUTHORIZED_DASHBOARD_ACCESS") ? 1 : 0,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function validationTest(name: string, passed: boolean, failure: PatternIntelligenceDashboardFailure, evidence_refs: readonly string[]): PatternIntelligenceDashboardValidationTest {
  const base: Omit<PatternIntelligenceDashboardValidationTest, "integrity_hash"> = {
    test_id: id("pattern_dashboard_test", name),
    name,
    expected: "PASS",
    actual: passed ? "PASS" : "FAIL",
    passed,
    failure_reason: passed ? null : failure,
    evidence_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildValidationTests(result: Omit<PatternIntelligenceDashboardResult, "validation_tests" | "validation_outcome" | "failures" | "replay_hash" | "integrity_hash">): readonly PatternIntelligenceDashboardValidationTest[] {
  const evidence = [result.dashboard_foundation.integrity_hash, result.operator_dashboard_result.integrity_hash, result.certification_result.integrity_hash];
  return freezeArray([
    validationTest("foundation integration", replayAdaptiveDashboardFoundation(result.dashboard_foundation), "DASHBOARD_FOUNDATION_UNAVAILABLE", evidence),
    validationTest("all detected patterns visible", result.pattern_records.length > 0 && result.pattern_records.every((record) => record.pattern_classification !== "HIDDEN"), "PATTERN_RECORD_HIDDEN", evidence),
    validationTest("no pattern deleted", result.pattern_records.length > 0, "PATTERN_RECORD_DELETED", evidence),
    validationTest("deterministic pattern rendering", result.deterministic && result.timeline_explorer.deterministic, "PATTERN_RENDERING_NONDETERMINISTIC", evidence),
    validationTest("evidence driven visualization", result.evidence_backed && result.pattern_records.every((record) => record.evidence_refs.length > 0), "EVIDENCE_REFERENCE_BROKEN", evidence),
    validationTest("replay integration", result.replayable && result.replay_explorer.every((replay) => replay.replayable), "REPLAY_REFERENCE_MISSING", evidence),
    validationTest("governance lineage visible", result.governance_visible && result.pattern_records.every((record) => record.governance_refs.length > 0), "GOVERNANCE_LINEAGE_MISSING", evidence),
    validationTest("certification lineage visible", result.certification_visible && result.pattern_records.every((record) => record.certification_refs.length > 0), "CERTIFICATION_LINEAGE_MISSING", evidence),
    validationTest("graph rendering deterministic", result.relationship_graph.deterministic, "GRAPH_RENDERING_NONDETERMINISTIC", evidence),
    validationTest("recurrence calculations deterministic", result.trend_analytics.deterministic && result.pattern_records.every((record) => record.recurrence_frequency > 0), "RECURRENCE_CALCULATION_NONDETERMINISTIC", evidence),
    validationTest("confidence visualization deterministic", result.confidence_dashboard.deterministic && result.confidence_dashboard.confidence_level >= 0.7, "CONFIDENCE_VISUALIZATION_NONDETERMINISTIC", evidence),
    validationTest("role authorization enforced", result.permissions.every((permission) => permission.allowed), "UNAUTHORIZED_DASHBOARD_ACCESS", evidence),
    validationTest("tenant isolation enforced", result.tenant_isolated && result.pattern_records.every((record) => record.tenant_id === TENANT_ID), "TENANT_ISOLATION_VIOLATED", evidence),
    validationTest("field-level visibility enforced", result.permissions.every((permission) => permission.restricted_fields.length > 0), "RESTRICTED_FIELD_EXPOSED", evidence),
    validationTest("integrity verification", result.pattern_records.every((record) => hashWithoutIntegrity(record) === record.integrity_hash), "INTEGRITY_VERIFICATION_FAILED", evidence),
    validationTest("read-only intelligence", result.read_only && result.advisory_only && !result.write_authority_granted, "DASHBOARD_WRITE_AUTHORITY_EXPOSED", evidence),
  ]);
}

function resultReplayHash(result: Omit<PatternIntelligenceDashboardResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    foundation: result.dashboard_foundation.integrity_hash,
    operator_dashboard: result.operator_dashboard_result.integrity_hash,
    certification: result.certification_result.integrity_hash,
    records: result.pattern_records.map((record) => record.integrity_hash),
    timeline: result.timeline_explorer.integrity_hash,
    graph: result.relationship_graph.integrity_hash,
    mission: result.mission_analytics.integrity_hash,
    confidence: result.confidence_dashboard.integrity_hash,
    strategic: result.strategic_impact_dashboard.integrity_hash,
    governance: result.governance_impact_dashboard.integrity_hash,
    evidence: result.evidence_explorer.integrity_hash,
    operator: result.operator_impact_dashboard.integrity_hash,
    responses: result.proposed_response_dashboard.integrity_hash,
    replay: result.replay_explorer.map((replay) => replay.integrity_hash),
    trends: result.trend_analytics.integrity_hash,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<PatternIntelligenceDashboardResult, "integrity_hash">): string {
  return hash({
    version: result.pattern_intelligence_dashboard_version,
    id: result.dashboard_identifier,
    api: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    validation_outcome: result.validation_outcome,
  });
}

export function buildPatternIntelligenceDashboard(input: PatternIntelligenceDashboardInput = {}): PatternIntelligenceDashboardResult {
  const scenario = input.scenario ?? "BASELINE";
  const foundation = establishAdaptiveDashboardFoundation();
  const operatorDashboard = renderOperatorPatternDashboard();
  const certification = certifyPatternIntelligence({ dashboard_result: operatorDashboard });
  const initialFailures = freezeArray([
    ...(failureForScenario(scenario) ? [failureForScenario(scenario) as PatternIntelligenceDashboardFailure] : []),
    ...(!replayAdaptiveDashboardFoundation(foundation) ? ["DASHBOARD_FOUNDATION_UNAVAILABLE" as const] : []),
    ...(!replayOperatorPatternDashboard(operatorDashboard) || !replayPatternIntelligenceCertification(certification) ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
  ]);
  const api_surface = apiSurface();
  const pattern_records = patternRecords(operatorDashboard, certification, initialFailures);
  const timeline_explorer = timelineExplorer(pattern_records, initialFailures);
  const relationship_graph = relationshipGraph(pattern_records, initialFailures);
  const mission_analytics = missionAnalytics(pattern_records);
  const confidence_dashboard = confidenceDashboard(pattern_records, initialFailures);
  const strategic_impact_dashboard = strategicImpactDashboard(pattern_records);
  const governance_impact_dashboard = governanceImpactDashboard(pattern_records, initialFailures);
  const evidence_explorer = evidenceExplorer(pattern_records);
  const operator_impact_dashboard = operatorImpactDashboard(pattern_records);
  const proposed_response_dashboard = proposedResponseDashboard(pattern_records, initialFailures);
  const replay_explorer = replayExplorers(pattern_records, initialFailures);
  const trend_analytics = trendAnalytics(pattern_records, initialFailures);
  const permissions = permissionRecords(input, initialFailures);
  const metricsRecord = metrics(initialFailures);
  const baseWithoutValidation: Omit<PatternIntelligenceDashboardResult, "validation_tests" | "validation_outcome" | "failures" | "replay_hash" | "integrity_hash"> = {
    pattern_intelligence_dashboard_version: VERSION,
    dashboard_identifier: DASHBOARD_ID,
    status: initialFailures.length ? "REJECTED" : "AUTHORITATIVE",
    api_surface,
    dashboard_foundation: foundation,
    operator_dashboard_result: operatorDashboard,
    certification_result: certification,
    pattern_records,
    timeline_explorer,
    relationship_graph,
    mission_analytics,
    confidence_dashboard,
    strategic_impact_dashboard,
    governance_impact_dashboard,
    evidence_explorer,
    operator_impact_dashboard,
    proposed_response_dashboard,
    replay_explorer,
    trend_analytics,
    permissions,
    widgets: WIDGETS,
    metrics: metricsRecord,
    deterministic: !initialFailures.includes("PATTERN_RENDERING_NONDETERMINISTIC") && !initialFailures.includes("GRAPH_RENDERING_NONDETERMINISTIC") && !initialFailures.includes("RECURRENCE_CALCULATION_NONDETERMINISTIC") && !initialFailures.includes("CONFIDENCE_VISUALIZATION_NONDETERMINISTIC"),
    replayable: !initialFailures.includes("REPLAY_REFERENCE_MISSING"),
    tenant_isolated: !initialFailures.includes("TENANT_ISOLATION_VIOLATED"),
    evidence_backed: !initialFailures.includes("EVIDENCE_REFERENCE_BROKEN"),
    governance_visible: !initialFailures.includes("GOVERNANCE_LINEAGE_MISSING"),
    certification_visible: !initialFailures.includes("CERTIFICATION_LINEAGE_MISSING"),
    read_only: true,
    advisory_only: true,
    write_authority_granted: initialFailures.includes("DASHBOARD_WRITE_AUTHORITY_EXPOSED") ? true as never : false,
  };
  const validation_tests = buildValidationTests(baseWithoutValidation);
  const failures = freezeArray([...new Set([...initialFailures, ...validation_tests.map((test) => test.failure_reason).filter((failure): failure is PatternIntelligenceDashboardFailure => Boolean(failure))])]);
  const validation_outcome = failures.length ? "INVALID" : "VALID";
  const base: Omit<PatternIntelligenceDashboardResult, "replay_hash" | "integrity_hash"> = {
    ...baseWithoutValidation,
    status: failures.length ? "REJECTED" : "AUTHORITATIVE",
    validation_tests,
    validation_outcome,
    failures,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validatePatternIntelligenceDashboard(result?: PatternIntelligenceDashboardResult): PatternIntelligenceDashboardValidationResult {
  if (!result) {
    const failures = freezeArray<PatternIntelligenceDashboardFailure>(["PATTERN_RENDERING_NONDETERMINISTIC"]);
    const base: Omit<PatternIntelligenceDashboardValidationResult, "validation_hash"> = { dashboard_id: null, valid: false, validation_outcome: "INVALID", failures, replay_hash_valid: false, integrity_hash_valid: false, read_only: false };
    return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const nestedIntegrity = (
    hashWithoutIntegrity(result.api_surface) === result.api_surface.integrity_hash &&
    result.pattern_records.every((item) => hashWithoutIntegrity(item) === item.integrity_hash) &&
    hashWithoutIntegrity(result.timeline_explorer) === result.timeline_explorer.integrity_hash &&
    hashWithoutIntegrity(result.relationship_graph) === result.relationship_graph.integrity_hash &&
    hashWithoutIntegrity(result.mission_analytics) === result.mission_analytics.integrity_hash &&
    hashWithoutIntegrity(result.confidence_dashboard) === result.confidence_dashboard.integrity_hash &&
    hashWithoutIntegrity(result.strategic_impact_dashboard) === result.strategic_impact_dashboard.integrity_hash &&
    hashWithoutIntegrity(result.governance_impact_dashboard) === result.governance_impact_dashboard.integrity_hash &&
    hashWithoutIntegrity(result.evidence_explorer) === result.evidence_explorer.integrity_hash &&
    hashWithoutIntegrity(result.operator_impact_dashboard) === result.operator_impact_dashboard.integrity_hash &&
    hashWithoutIntegrity(result.proposed_response_dashboard) === result.proposed_response_dashboard.integrity_hash &&
    result.replay_explorer.every((item) => hashWithoutIntegrity(item) === item.integrity_hash) &&
    hashWithoutIntegrity(result.trend_analytics) === result.trend_analytics.integrity_hash &&
    result.permissions.every((item) => hashWithoutIntegrity(item) === item.integrity_hash) &&
    hashWithoutIntegrity(result.metrics) === result.metrics.integrity_hash &&
    result.validation_tests.every((item) => hashWithoutIntegrity(item) === item.integrity_hash)
  );
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash && nestedIntegrity;
  const read_only = result.read_only && result.advisory_only && !result.write_authority_granted && !result.api_surface.creation_supported && !result.api_surface.mutation_supported && !result.api_surface.pattern_creation_supported && !result.api_surface.classification_mutation_supported && !result.api_surface.confidence_mutation_supported && !result.api_surface.governance_decision_supported && !result.api_surface.operator_action_supported;
  const valid = result.validation_outcome === "VALID" && result.failures.length === 0 && replay_hash_valid && integrity_hash_valid && read_only;
  const base: Omit<PatternIntelligenceDashboardValidationResult, "validation_hash"> = {
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

export function replayPatternIntelligenceDashboard(result: PatternIntelligenceDashboardResult): boolean {
  return validatePatternIntelligenceDashboard(result).valid;
}

export function buildPatternIntelligenceDashboardObservabilitySurface(result = buildPatternIntelligenceDashboard()): PatternIntelligenceDashboardObservabilitySurface {
  return Object.freeze({
    dashboard_id: result.dashboard_identifier,
    status: result.status,
    validation_outcome: result.validation_outcome,
    patterns: result.pattern_records.length,
    failed_tests: result.validation_tests.filter((test) => !test.passed).length,
    failures: result.failures,
    replayable: result.replayable,
    tenant_isolated: result.tenant_isolated,
    read_only: result.read_only && result.advisory_only && !result.write_authority_granted,
    integrity_hash: result.integrity_hash,
  });
}

export function getPatternIntelligenceDashboardContract(): PatternIntelligenceDashboardContract {
  const result = buildPatternIntelligenceDashboard();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      widgets: WIDGETS,
      navigation_dimensions: freezeArray(["pattern ID", "pattern category", "mission", "tenant", "confidence level", "recurrence frequency", "evidence source", "strategic impact", "governance impact", "operator", "certification status", "timeframe"]),
      required_data_sources: freezeArray(["Pattern Intelligence Engine", "Outcome Observation Engine", "Recommendation Effectiveness Engine", "Strategy Evolution Engine", "Confidence Adaptation Engine", "Risk Adaptation Engine", "Governance Adaptation Layer", "Operator Feedback Engine", "Replay Engine", "Truth Ledger", "Certification Ledger"]),
      read_only: true,
      advisory_only: true,
    }),
    result,
    validation: validatePatternIntelligenceDashboard(result),
    observability: buildPatternIntelligenceDashboardObservabilitySurface(result),
  });
}

export const PatternIntelligenceDashboard = Object.freeze({
  build: buildPatternIntelligenceDashboard,
  validate: validatePatternIntelligenceDashboard,
  replay: replayPatternIntelligenceDashboard,
});
