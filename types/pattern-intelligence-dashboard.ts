import type { AdaptiveDashboardResult, DashboardRole } from "@/types/adaptive-dashboard-foundation";
import type { PatternCertificationResult } from "@/types/pattern-intelligence-certification-gate";
import type { PatternDashboardResult } from "@/types/operator-pattern-intelligence-dashboard";

export type PatternIntelligenceDashboardStatus = "AUTHORITATIVE" | "REJECTED";
export type PatternIntelligenceDashboardValidationOutcome = "VALID" | "INVALID";
export type PatternIntelligenceTrendDirection = "IMPROVING" | "STABLE" | "DEGRADING";
export type PatternIntelligenceImpactLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type PatternIntelligenceWidget = "Pattern Timeline" | "Pattern Graph" | "Mission Heatmap" | "Evidence Viewer" | "Confidence Distribution" | "Strategic Impact" | "Recurrence Trend" | "Replay Explorer" | "Governance Impact" | "Operator Impact";

export type PatternIntelligenceDashboardScenario =
  | "BASELINE"
  | "FOUNDATION_UNAVAILABLE"
  | "PATTERN_HIDDEN"
  | "PATTERN_DELETED"
  | "NONDETERMINISTIC_RENDERING"
  | "MISSING_EVIDENCE"
  | "MISSING_REPLAY"
  | "MISSING_GOVERNANCE"
  | "MISSING_CERTIFICATION"
  | "GRAPH_DRIFT"
  | "RECURRENCE_DRIFT"
  | "CONFIDENCE_DRIFT"
  | "UNAUTHORIZED_ROLE"
  | "TENANT_LEAK"
  | "RESTRICTED_FIELD_LEAK"
  | "INTEGRITY_FAILURE"
  | "WRITE_AUTHORITY_EXPOSED";

export type PatternIntelligenceDashboardFailure =
  | "DASHBOARD_FOUNDATION_UNAVAILABLE"
  | "PATTERN_RECORD_HIDDEN"
  | "PATTERN_RECORD_DELETED"
  | "PATTERN_RENDERING_NONDETERMINISTIC"
  | "EVIDENCE_REFERENCE_BROKEN"
  | "REPLAY_REFERENCE_MISSING"
  | "GOVERNANCE_LINEAGE_MISSING"
  | "CERTIFICATION_LINEAGE_MISSING"
  | "GRAPH_RENDERING_NONDETERMINISTIC"
  | "RECURRENCE_CALCULATION_NONDETERMINISTIC"
  | "CONFIDENCE_VISUALIZATION_NONDETERMINISTIC"
  | "UNAUTHORIZED_DASHBOARD_ACCESS"
  | "TENANT_ISOLATION_VIOLATED"
  | "RESTRICTED_FIELD_EXPOSED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "DASHBOARD_WRITE_AUTHORITY_EXPOSED";

export type PatternRecordView = Readonly<{
  pattern_view_id: string;
  tenant_id: string;
  mission_id: string;
  pattern_id: string;
  pattern_classification: string;
  pattern_category: string;
  detection_timestamp: string;
  current_status: "DETECTED" | "CERTIFIED" | "BLOCKED" | "PENDING";
  confidence_score: number;
  recurrence_frequency: number;
  certification_status: "CERTIFIED" | "PENDING" | "BLOCKED";
  replay_available: boolean;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type PatternTimelineExplorer = Readonly<{
  timeline_id: string;
  chronological_pattern_refs: readonly string[];
  recurrence_history_refs: readonly string[];
  lifecycle_progression_refs: readonly string[];
  certification_milestones: readonly string[];
  deterministic: boolean;
  integrity_hash: string;
}>;

export type PatternRelationshipGraph = Readonly<{
  graph_id: string;
  pattern_nodes: readonly string[];
  relationship_edges: readonly string[];
  shared_evidence_refs: readonly string[];
  linked_mission_refs: readonly string[];
  related_recommendation_refs: readonly string[];
  dependency_refs: readonly string[];
  deterministic: boolean;
  integrity_hash: string;
}>;

export type MissionPatternAnalytics = Readonly<{
  analytics_id: string;
  affected_missions: readonly string[];
  mission_categories: readonly string[];
  mission_performance_refs: readonly string[];
  recurring_issue_refs: readonly string[];
  improvement_refs: readonly string[];
  dependency_refs: readonly string[];
  integrity_hash: string;
}>;

export type PatternConfidenceDashboard = Readonly<{
  confidence_id: string;
  confidence_level: number;
  confidence_history: readonly string[];
  confidence_distribution: readonly string[];
  supporting_observations: readonly string[];
  confidence_variance: number;
  confidence_trend: PatternIntelligenceTrendDirection;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type StrategicImpactDashboard = Readonly<{
  strategic_id: string;
  strategic_opportunities: readonly string[];
  recurring_weaknesses: readonly string[];
  operational_improvements: readonly string[];
  optimization_opportunities: readonly string[];
  expected_mission_impact: PatternIntelligenceImpactLevel;
  strategy_evolution_candidates: readonly string[];
  integrity_hash: string;
}>;

export type GovernanceImpactDashboard = Readonly<{
  governance_id: string;
  governance_impact: PatternIntelligenceImpactLevel;
  constitutional_impact: PatternIntelligenceImpactLevel;
  policy_implications: readonly string[];
  authority_considerations: readonly string[];
  escalation_requirements: readonly string[];
  certification_implications: readonly string[];
  governance_lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type PatternEvidenceExplorer = Readonly<{
  evidence_id: string;
  supporting_observations: readonly string[];
  linked_outcomes: readonly string[];
  linked_recommendations: readonly string[];
  linked_simulations: readonly string[];
  linked_feedback: readonly string[];
  linked_governance_reviews: readonly string[];
  linked_replay_records: readonly string[];
  integrity_hash: string;
}>;

export type OperatorImpactDashboard = Readonly<{
  operator_id: string;
  affected_operators: readonly string[];
  operator_trends: readonly string[];
  override_patterns: readonly string[];
  approval_behavior: readonly string[];
  review_latency_ms: number;
  operator_consistency: number;
  workload_distribution: readonly string[];
  integrity_hash: string;
}>;

export type ProposedResponseDashboard = Readonly<{
  response_id: string;
  proposed_responses: readonly string[];
  response_rationale: readonly string[];
  expected_benefit: PatternIntelligenceImpactLevel;
  expected_risk: PatternIntelligenceImpactLevel;
  simulation_status: "READY" | "PENDING" | "BLOCKED";
  governance_review: "VISIBLE" | "MISSING";
  certification_readiness: "READY" | "BLOCKED";
  proposal_lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type PatternReplayExplorer = Readonly<{
  replay_id: string;
  originating_observations: readonly string[];
  evidence_lineage_refs: readonly string[];
  recommendation_lineage_refs: readonly string[];
  mission_history_refs: readonly string[];
  operator_action_refs: readonly string[];
  governance_decision_refs: readonly string[];
  certification_record_refs: readonly string[];
  replayable: boolean;
  integrity_hash: string;
}>;

export type PatternTrendAnalytics = Readonly<{
  trend_id: string;
  recurrence_trend: PatternIntelligenceTrendDirection;
  confidence_trend: PatternIntelligenceTrendDirection;
  strategic_impact_trend: PatternIntelligenceTrendDirection;
  governance_impact_trend: PatternIntelligenceTrendDirection;
  pattern_persistence_score: number;
  historical_comparison_refs: readonly string[];
  deterministic: boolean;
  integrity_hash: string;
}>;

export type PatternIntelligenceDashboardPermission = Readonly<{
  permission_id: string;
  role: DashboardRole;
  tenant_id: string;
  allowed: boolean;
  restricted_fields: readonly string[];
  tenant_isolated: boolean;
  governance_authorized: boolean;
  evidence_authorized: boolean;
  replay_authorized: boolean;
  certification_authorized: boolean;
  integrity_hash: string;
}>;

export type PatternIntelligenceDashboardMetrics = Readonly<{
  rendering_latency_ms: number;
  pattern_sync_latency_ms: number;
  missing_pattern_records: number;
  stale_visualizations: number;
  broken_evidence_references: number;
  replay_resolution_failures: number;
  graph_rendering_failures: number;
  integrity_verification_failures: number;
  unauthorized_access_attempts: number;
  integrity_hash: string;
}>;

export type PatternIntelligenceDashboardValidationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: "PASS" | "FAIL";
  passed: boolean;
  failure_reason: PatternIntelligenceDashboardFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type PatternIntelligenceDashboardApiSurface = Readonly<{
  api_id: string;
  retrieve_dashboard: "POST /pattern-intelligence-dashboard/dashboard";
  retrieve_contract: "GET /pattern-intelligence-dashboard/contract";
  retrieve_patterns: "POST /pattern-intelligence-dashboard/patterns";
  retrieve_timeline: "POST /pattern-intelligence-dashboard/timeline";
  retrieve_graph: "POST /pattern-intelligence-dashboard/graph";
  retrieve_mission: "POST /pattern-intelligence-dashboard/mission";
  retrieve_confidence: "POST /pattern-intelligence-dashboard/confidence";
  retrieve_strategic: "POST /pattern-intelligence-dashboard/strategic";
  retrieve_governance: "POST /pattern-intelligence-dashboard/governance";
  retrieve_evidence: "POST /pattern-intelligence-dashboard/evidence";
  retrieve_operator: "POST /pattern-intelligence-dashboard/operator";
  retrieve_responses: "POST /pattern-intelligence-dashboard/responses";
  retrieve_replay: "POST /pattern-intelligence-dashboard/replay";
  retrieve_trends: "POST /pattern-intelligence-dashboard/trends";
  validate_dashboard: "POST /pattern-intelligence-dashboard/validate";
  inspect_dashboard: "POST /pattern-intelligence-dashboard/inspect";
  creation_supported: false;
  mutation_supported: false;
  pattern_creation_supported: false;
  classification_mutation_supported: false;
  confidence_mutation_supported: false;
  governance_decision_supported: false;
  operator_action_supported: false;
  integrity_hash: string;
}>;

export type PatternIntelligenceDashboardInput = Readonly<{
  scenario?: PatternIntelligenceDashboardScenario;
  role?: DashboardRole;
  tenant_id?: string;
}>;

export type PatternIntelligenceDashboardResult = Readonly<{
  pattern_intelligence_dashboard_version: "pattern-intelligence-dashboard/v10.14.4";
  dashboard_identifier: "PatternIntelligenceDashboard";
  status: PatternIntelligenceDashboardStatus;
  api_surface: PatternIntelligenceDashboardApiSurface;
  dashboard_foundation: AdaptiveDashboardResult;
  operator_dashboard_result: PatternDashboardResult;
  certification_result: PatternCertificationResult;
  pattern_records: readonly PatternRecordView[];
  timeline_explorer: PatternTimelineExplorer;
  relationship_graph: PatternRelationshipGraph;
  mission_analytics: MissionPatternAnalytics;
  confidence_dashboard: PatternConfidenceDashboard;
  strategic_impact_dashboard: StrategicImpactDashboard;
  governance_impact_dashboard: GovernanceImpactDashboard;
  evidence_explorer: PatternEvidenceExplorer;
  operator_impact_dashboard: OperatorImpactDashboard;
  proposed_response_dashboard: ProposedResponseDashboard;
  replay_explorer: readonly PatternReplayExplorer[];
  trend_analytics: PatternTrendAnalytics;
  permissions: readonly PatternIntelligenceDashboardPermission[];
  widgets: readonly PatternIntelligenceWidget[];
  metrics: PatternIntelligenceDashboardMetrics;
  validation_tests: readonly PatternIntelligenceDashboardValidationTest[];
  validation_outcome: PatternIntelligenceDashboardValidationOutcome;
  failures: readonly PatternIntelligenceDashboardFailure[];
  deterministic: boolean;
  replayable: boolean;
  tenant_isolated: boolean;
  evidence_backed: boolean;
  governance_visible: boolean;
  certification_visible: boolean;
  read_only: true;
  advisory_only: true;
  write_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type PatternIntelligenceDashboardValidationResult = Readonly<{
  dashboard_id: string | null;
  valid: boolean;
  validation_outcome: PatternIntelligenceDashboardValidationOutcome;
  failures: readonly PatternIntelligenceDashboardFailure[];
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  read_only: boolean;
  validation_hash: string;
}>;

export type PatternIntelligenceDashboardObservabilitySurface = Readonly<{
  dashboard_id: string;
  status: PatternIntelligenceDashboardStatus;
  validation_outcome: PatternIntelligenceDashboardValidationOutcome;
  patterns: number;
  failed_tests: number;
  failures: readonly PatternIntelligenceDashboardFailure[];
  replayable: boolean;
  tenant_isolated: boolean;
  read_only: boolean;
  integrity_hash: string;
}>;

export type PatternIntelligenceDashboardContract = Readonly<{
  doctrine: Readonly<{
    version: "pattern-intelligence-dashboard/v10.14.4";
    widgets: readonly PatternIntelligenceWidget[];
    navigation_dimensions: readonly string[];
    required_data_sources: readonly string[];
    read_only: true;
    advisory_only: true;
  }>;
  result: PatternIntelligenceDashboardResult;
  validation: PatternIntelligenceDashboardValidationResult;
  observability: PatternIntelligenceDashboardObservabilitySurface;
}>;
