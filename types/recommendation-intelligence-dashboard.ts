import type { AdaptiveDashboardResult, DashboardRole } from "@/types/adaptive-dashboard-foundation";
import type { RecommendationEffectivenessResult } from "@/types/recommendation-effectiveness-contract";
import type { RecommendationEffectivenessCertificationGateResult } from "@/types/recommendation-effectiveness-certification-gate";
import type { AcceptanceAnalysisResult } from "@/types/recommendation-acceptance-analysis";
import type { RecommendationQualityResult } from "@/types/recommendation-quality-scoring";

export type RecommendationDashboardStatus = "AUTHORITATIVE" | "REJECTED";
export type RecommendationDashboardValidationOutcome = "VALID" | "INVALID";
export type RecommendationLifecycleState = "ACCEPTED" | "REJECTED" | "OVERRIDDEN" | "DEFERRED" | "PENDING" | "EXPIRED" | "SIMULATED" | "CERTIFIED";
export type RecommendationSeverity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type RecommendationTrendDirection = "IMPROVING" | "STABLE" | "DECLINING";
export type RecommendationDashboardWidget = "Recommendation Funnel" | "Acceptance Rate" | "Failure Causes" | "Override Analysis" | "Recommendation History" | "Quality Trend" | "Effectiveness Trend" | "Confidence Distribution" | "Risk Heat Map" | "Replay Explorer";

export type RecommendationDashboardScenario =
  | "BASELINE"
  | "FOUNDATION_UNAVAILABLE"
  | "RECOMMENDATION_HIDDEN"
  | "RECOMMENDATION_DELETED"
  | "NONDETERMINISTIC_RENDERING"
  | "MISSING_EVIDENCE"
  | "MISSING_REPLAY"
  | "MISSING_GOVERNANCE"
  | "MISSING_OPERATOR_HISTORY"
  | "QUALITY_CALCULATION_DRIFT"
  | "TREND_DRIFT"
  | "UNAUTHORIZED_ROLE"
  | "TENANT_LEAK"
  | "RESTRICTED_FIELD_LEAK"
  | "INTEGRITY_FAILURE"
  | "WRITE_AUTHORITY_EXPOSED";

export type RecommendationDashboardFailure =
  | "DASHBOARD_FOUNDATION_UNAVAILABLE"
  | "RECOMMENDATION_RECORD_HIDDEN"
  | "RECOMMENDATION_RECORD_DELETED"
  | "RECOMMENDATION_RENDERING_NONDETERMINISTIC"
  | "EVIDENCE_REFERENCE_BROKEN"
  | "REPLAY_REFERENCE_MISSING"
  | "GOVERNANCE_LINEAGE_MISSING"
  | "OPERATOR_DECISION_HISTORY_MISSING"
  | "QUALITY_CALCULATION_NONDETERMINISTIC"
  | "TREND_ANALYSIS_NONDETERMINISTIC"
  | "UNAUTHORIZED_DASHBOARD_ACCESS"
  | "TENANT_ISOLATION_VIOLATED"
  | "RESTRICTED_FIELD_EXPOSED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "DASHBOARD_WRITE_AUTHORITY_EXPOSED";

export type RecommendationRecordView = Readonly<{
  recommendation_view_id: string;
  tenant_id: string;
  mission_id: string;
  decision_id: string;
  recommendation_id: string;
  lifecycle_state: RecommendationLifecycleState;
  effectiveness_score: number;
  confidence_score: number;
  risk_score: number;
  quality_score: number;
  operator_decision: string;
  governance_decision: string;
  certification_status: "CERTIFIED" | "PENDING" | "BLOCKED";
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type RecommendationLifecycleDashboard = Readonly<{
  lifecycle_id: string;
  lifecycle_counts: readonly string[];
  timeline_refs: readonly string[];
  filter_dimensions: readonly string[];
  replay_launch_refs: readonly string[];
  evidence_inspection_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type RecommendationEffectivenessDashboard = Readonly<{
  effectiveness_id: string;
  effectiveness_score: number;
  predicted_effectiveness: number;
  actual_effectiveness: number;
  recommendation_success_rate: number;
  improvement_trends: readonly string[];
  mission_outcome_refs: readonly string[];
  recommendation_impact_refs: readonly string[];
  integrity_hash: string;
}>;

export type RecommendationConfidenceDashboard = Readonly<{
  confidence_id: string;
  recommendation_confidence: number;
  confidence_calibration: number;
  prediction_accuracy: number;
  confidence_variance: number;
  overconfidence: number;
  underconfidence: number;
  confidence_trends: readonly string[];
  integrity_hash: string;
}>;

export type RecommendationRiskDashboard = Readonly<{
  risk_id: string;
  predicted_risk: number;
  realized_risk: number;
  recommendation_severity: RecommendationSeverity;
  probability_estimate: number;
  mitigation_recommendations: readonly string[];
  residual_risk: number;
  risk_trends: readonly string[];
  integrity_hash: string;
}>;

export type OperatorInteractionDashboard = Readonly<{
  operator_id: string;
  acceptance_rate: number;
  rejection_rate: number;
  override_rate: number;
  deferment_rate: number;
  operator_modifications: number;
  review_duration_ms: number;
  approval_latency_ms: number;
  usability_score: number;
  integrity_hash: string;
}>;

export type RecommendationQualityDashboard = Readonly<{
  quality_id: string;
  recommendation_quality_score: number;
  evidence_completeness: number;
  explanation_quality: number;
  governance_compliance: number;
  constitutional_compliance: number;
  replay_readiness: number;
  certification_readiness: number;
  integrity_hash: string;
}>;

export type RecommendationFailureAnalysisDashboard = Readonly<{
  failure_id: string;
  failure_categories: readonly string[];
  failure_frequency: number;
  governance_failures: number;
  confidence_failures: number;
  risk_failures: number;
  evidence_deficiencies: number;
  operator_rejection_reasons: readonly string[];
  simulation_failures: number;
  integrity_hash: string;
}>;

export type RecommendationHistoryExplorer = Readonly<{
  history_id: string;
  chronological_records: readonly string[];
  recommendation_revisions: readonly string[];
  approval_history_refs: readonly string[];
  simulation_history_refs: readonly string[];
  certification_history_refs: readonly string[];
  operator_decision_refs: readonly string[];
  governance_decision_refs: readonly string[];
  integrity_hash: string;
}>;

export type RecommendationReplayExplorer = Readonly<{
  replay_id: string;
  recommendation_id: string;
  creation_ref: string;
  supporting_evidence_refs: readonly string[];
  reasoning_lineage_refs: readonly string[];
  operator_decision_refs: readonly string[];
  governance_review_refs: readonly string[];
  simulation_outcome_refs: readonly string[];
  certification_record_refs: readonly string[];
  replayable: boolean;
  integrity_hash: string;
}>;

export type RecommendationTrendDashboard = Readonly<{
  trend_id: string;
  effectiveness_trend: RecommendationTrendDirection;
  quality_trend: RecommendationTrendDirection;
  confidence_trend: RecommendationTrendDirection;
  risk_trend: RecommendationTrendDirection;
  operator_adoption: number;
  governance_outcomes: readonly string[];
  certification_success: number;
  historical_improvements: readonly string[];
  deterministic: boolean;
  integrity_hash: string;
}>;

export type RecommendationDashboardPermission = Readonly<{
  permission_id: string;
  role: DashboardRole;
  tenant_id: string;
  allowed: boolean;
  restricted_fields: readonly string[];
  tenant_isolated: boolean;
  governance_authorized: boolean;
  evidence_authorized: boolean;
  replay_authorized: boolean;
  integrity_hash: string;
}>;

export type RecommendationDashboardMetrics = Readonly<{
  rendering_latency_ms: number;
  recommendation_sync_latency_ms: number;
  missing_recommendation_records: number;
  broken_evidence_references: number;
  replay_resolution_failures: number;
  widget_rendering_failures: number;
  search_latency_ms: number;
  navigation_failures: number;
  integrity_verification_failures: number;
  unauthorized_access_attempts: number;
  integrity_hash: string;
}>;

export type RecommendationDashboardValidationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: "PASS" | "FAIL";
  passed: boolean;
  failure_reason: RecommendationDashboardFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type RecommendationDashboardApiSurface = Readonly<{
  api_id: string;
  retrieve_dashboard: "POST /recommendation-intelligence-dashboard/dashboard";
  retrieve_contract: "GET /recommendation-intelligence-dashboard/contract";
  retrieve_lifecycle: "POST /recommendation-intelligence-dashboard/lifecycle";
  retrieve_effectiveness: "POST /recommendation-intelligence-dashboard/effectiveness";
  retrieve_confidence: "POST /recommendation-intelligence-dashboard/confidence";
  retrieve_risk: "POST /recommendation-intelligence-dashboard/risk";
  retrieve_operator: "POST /recommendation-intelligence-dashboard/operator";
  retrieve_quality: "POST /recommendation-intelligence-dashboard/quality";
  retrieve_failure: "POST /recommendation-intelligence-dashboard/failure";
  retrieve_history: "POST /recommendation-intelligence-dashboard/history";
  retrieve_replay: "POST /recommendation-intelligence-dashboard/replay";
  retrieve_trends: "POST /recommendation-intelligence-dashboard/trends";
  validate_dashboard: "POST /recommendation-intelligence-dashboard/validate";
  inspect_dashboard: "POST /recommendation-intelligence-dashboard/inspect";
  creation_supported: false;
  mutation_supported: false;
  governance_decision_supported: false;
  operator_action_supported: false;
  integrity_hash: string;
}>;

export type RecommendationDashboardInput = Readonly<{
  scenario?: RecommendationDashboardScenario;
  role?: DashboardRole;
  tenant_id?: string;
}>;

export type RecommendationDashboardResult = Readonly<{
  recommendation_intelligence_dashboard_version: "recommendation-intelligence-dashboard/v10.14.3";
  dashboard_identifier: "RecommendationIntelligenceDashboard";
  status: RecommendationDashboardStatus;
  api_surface: RecommendationDashboardApiSurface;
  dashboard_foundation: AdaptiveDashboardResult;
  effectiveness_result: RecommendationEffectivenessResult;
  acceptance_result: AcceptanceAnalysisResult;
  quality_result: RecommendationQualityResult;
  certification_result: RecommendationEffectivenessCertificationGateResult;
  recommendation_records: readonly RecommendationRecordView[];
  lifecycle_dashboard: RecommendationLifecycleDashboard;
  effectiveness_dashboard: RecommendationEffectivenessDashboard;
  confidence_dashboard: RecommendationConfidenceDashboard;
  risk_dashboard: RecommendationRiskDashboard;
  operator_dashboard: OperatorInteractionDashboard;
  quality_dashboard: RecommendationQualityDashboard;
  failure_dashboard: RecommendationFailureAnalysisDashboard;
  history_explorer: RecommendationHistoryExplorer;
  replay_explorer: readonly RecommendationReplayExplorer[];
  trend_dashboard: RecommendationTrendDashboard;
  permissions: readonly RecommendationDashboardPermission[];
  widgets: readonly RecommendationDashboardWidget[];
  metrics: RecommendationDashboardMetrics;
  validation_tests: readonly RecommendationDashboardValidationTest[];
  validation_outcome: RecommendationDashboardValidationOutcome;
  failures: readonly RecommendationDashboardFailure[];
  deterministic: boolean;
  replayable: boolean;
  tenant_isolated: boolean;
  evidence_backed: boolean;
  governance_visible: boolean;
  read_only: true;
  advisory_only: true;
  write_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type RecommendationDashboardValidationResult = Readonly<{
  dashboard_id: string | null;
  valid: boolean;
  validation_outcome: RecommendationDashboardValidationOutcome;
  failures: readonly RecommendationDashboardFailure[];
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  read_only: boolean;
  validation_hash: string;
}>;

export type RecommendationDashboardObservabilitySurface = Readonly<{
  dashboard_id: string;
  status: RecommendationDashboardStatus;
  validation_outcome: RecommendationDashboardValidationOutcome;
  recommendations: number;
  failed_tests: number;
  failures: readonly RecommendationDashboardFailure[];
  replayable: boolean;
  tenant_isolated: boolean;
  read_only: boolean;
  integrity_hash: string;
}>;

export type RecommendationDashboardContract = Readonly<{
  doctrine: Readonly<{
    version: "recommendation-intelligence-dashboard/v10.14.3";
    widgets: readonly RecommendationDashboardWidget[];
    lifecycle_states: readonly RecommendationLifecycleState[];
    navigation_dimensions: readonly string[];
    required_data_sources: readonly string[];
    read_only: true;
    advisory_only: true;
  }>;
  result: RecommendationDashboardResult;
  validation: RecommendationDashboardValidationResult;
  observability: RecommendationDashboardObservabilitySurface;
}>;
