import type { FeedbackGovernanceValidationResult } from "@/types/operator-feedback-governance-validation";

export type FeedbackDashboardPanelType =
  | "FEEDBACK_VOLUME"
  | "FEEDBACK_TYPES"
  | "OVERRIDE_TRENDS"
  | "REJECTION_TRENDS"
  | "CONFIDENCE_TRENDS"
  | "GOVERNANCE_FEEDBACK"
  | "ADAPTATION_CANDIDATES"
  | "REPLAY_EXPLORER";

export type FeedbackAnalyticsTrendDirection = "INCREASING" | "STABLE" | "DECREASING" | "INSUFFICIENT_DATA";
export type FeedbackAnalyticsState = "CERTIFIED" | "PENDING_EVIDENCE" | "FAILED";

export type FeedbackAnalyticsFailure =
  | "REQUIRED_EVIDENCE_UNAVAILABLE"
  | "REPLAY_LINEAGE_INCOMPLETE"
  | "CALCULATION_RULES_MISSING"
  | "DASHBOARD_VERSION_INVALID"
  | "GOVERNANCE_METADATA_INCOMPLETE"
  | "TENANT_OWNERSHIP_AMBIGUOUS"
  | "ROLE_ACCESS_DENIED"
  | "FILTER_INVALID"
  | "HIDDEN_VISUALIZATION_DETECTED"
  | "NONDETERMINISTIC_CALCULATION_DETECTED"
  | "UNSUPPORTED_ANALYTICS"
  | "ORPHANED_DASHBOARD_METRIC"
  | "REPLAY_INCONSISTENCY"
  | "FEEDBACK_MUTATION_ATTEMPT"
  | "ADAPTIVE_PROPOSAL_GENERATION_ATTEMPT"
  | "RECOMMENDATION_MUTATION_ATTEMPT"
  | "SIMULATION_EXECUTION_ATTEMPT"
  | "GOVERNANCE_OVERRIDE_ATTEMPT"
  | "ADAPTATION_APPROVAL_ATTEMPT"
  | "PRODUCTION_MUTATION_ATTEMPT";

export type FeedbackAnalyticsScenario =
  | "BASELINE"
  | "VOLUME_SPIKE"
  | "OVERRIDE_TREND"
  | "REJECTION_TREND"
  | "CONFIDENCE_DRIFT"
  | "GOVERNANCE_HOTSPOT"
  | "ADAPTATION_CANDIDATE"
  | "SIMULATION_OPPORTUNITY"
  | "MISSING_EVIDENCE"
  | "MISSING_REPLAY"
  | "MISSING_CALCULATION_RULES"
  | "INVALID_DASHBOARD_VERSION"
  | "MISSING_GOVERNANCE_METADATA"
  | "TENANT_AMBIGUOUS"
  | "ROLE_DENIED"
  | "INVALID_FILTER"
  | "HIDDEN_VISUALIZATION"
  | "NONDETERMINISTIC_CALCULATION"
  | "UNSUPPORTED_ANALYTICS"
  | "ORPHANED_METRIC"
  | "REPLAY_INCONSISTENCY"
  | "FEEDBACK_MUTATION_ATTEMPT"
  | "ADAPTIVE_PROPOSAL_GENERATION_ATTEMPT"
  | "RECOMMENDATION_MUTATION_ATTEMPT"
  | "SIMULATION_EXECUTION_ATTEMPT"
  | "GOVERNANCE_OVERRIDE_ATTEMPT"
  | "ADAPTATION_APPROVAL_ATTEMPT"
  | "PRODUCTION_MUTATION_ATTEMPT";

export type FeedbackAnalyticsFilters = Readonly<{
  tenant_id: string;
  mission_id?: string;
  operator_id?: string;
  recommendation_category?: string;
  date_range: "ALL" | "LAST_7_DAYS" | "LAST_30_DAYS" | "LAST_90_DAYS";
  governance_status?: string;
  confidence_level?: string;
  deterministic: true;
  integrity_hash: string;
}>;

export type FeedbackAnalyticsMetric = Readonly<{
  metric_id: string;
  metric_name: string;
  value: number;
  percentage: number;
  trend_direction: FeedbackAnalyticsTrendDirection;
  methodology: string;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  governance_refs: readonly string[];
  integrity_hash: string;
}>;

export type FeedbackDashboardPanel = Readonly<{
  panel_id: string;
  panel_type: FeedbackDashboardPanelType;
  title: string;
  metrics: readonly FeedbackAnalyticsMetric[];
  applied_filters: FeedbackAnalyticsFilters;
  data_source: string;
  calculation_methodology: string;
  supporting_evidence: readonly string[];
  replay_references: readonly string[];
  governance_considerations: readonly string[];
  drill_down_refs: readonly string[];
  explanation: string;
  visualization_hash: string;
  integrity_hash: string;
}>;

export type FeedbackReplayExplorer = Readonly<{
  explorer_id: string;
  feedback_history_refs: readonly string[];
  decision_refs: readonly string[];
  recommendation_refs: readonly string[];
  evidence_refs: readonly string[];
  mission_outcome_refs: readonly string[];
  simulation_refs: readonly string[];
  governance_review_refs: readonly string[];
  adaptive_evidence_refs: readonly string[];
  certification_lineage_refs: readonly string[];
  replayable: boolean;
  integrity_hash: string;
}>;

export type FeedbackDashboardAuditEvent = Readonly<{
  audit_id: string;
  dashboard_version: "feedback-analytics-dashboard/v1";
  analytics_version: "feedback-analytics/v1";
  calculation_version: "feedback-dashboard-calculations/v1";
  query_parameters_hash: string;
  replay_identifier: string;
  visualization_timestamp: string;
  evidence_references: readonly string[];
  governance_metadata: readonly string[];
  append_only: true;
  immutable: true;
  integrity_hash: string;
}>;

export type FeedbackDashboardApiSurface = Readonly<{
  api_id: string;
  retrieve_dashboard: "POST /feedback-analytics-dashboard/dashboard";
  retrieve_volume: "POST /feedback-analytics-dashboard/volume";
  retrieve_types: "POST /feedback-analytics-dashboard/types";
  retrieve_overrides: "POST /feedback-analytics-dashboard/overrides";
  retrieve_rejections: "POST /feedback-analytics-dashboard/rejections";
  retrieve_confidence: "POST /feedback-analytics-dashboard/confidence";
  retrieve_governance: "POST /feedback-analytics-dashboard/governance";
  retrieve_adaptation_candidates: "POST /feedback-analytics-dashboard/adaptation-candidates";
  retrieve_replay_explorer: "POST /feedback-analytics-dashboard/replay-explorer";
  retrieve_explanation: "POST /feedback-analytics-dashboard/explanation";
  retrieve_audit: "POST /feedback-analytics-dashboard/audit";
  replay_dashboard: "POST /feedback-analytics-dashboard/replay";
  retrieve_contract: "GET /feedback-analytics-dashboard/contract";
  feedback_mutation_supported: false;
  adaptive_proposal_generation_supported: false;
  recommendation_mutation_supported: false;
  simulation_execution_supported: false;
  governance_override_supported: false;
  adaptation_approval_supported: false;
  production_mutation_supported: false;
  observational_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type FeedbackAnalyticsDashboardInput = Readonly<{
  scenario?: FeedbackAnalyticsScenario;
  governance_result?: FeedbackGovernanceValidationResult;
  filters?: Partial<FeedbackAnalyticsFilters>;
}>;

export type FeedbackAnalyticsDashboardResult = Readonly<{
  feedback_analytics_dashboard_version: "feedback-analytics-dashboard/v1";
  analytics_version: "feedback-analytics/v1";
  calculation_version: "feedback-dashboard-calculations/v1";
  api_surface: FeedbackDashboardApiSurface;
  governance_result: FeedbackGovernanceValidationResult;
  filters: FeedbackAnalyticsFilters;
  panels: readonly FeedbackDashboardPanel[];
  replay_explorer: FeedbackReplayExplorer;
  audit_events: readonly FeedbackDashboardAuditEvent[];
  analytics_state: FeedbackAnalyticsState;
  failures: readonly FeedbackAnalyticsFailure[];
  replay_hash: string;
  integrity_hash: string;
  deterministic: true;
  replayable: boolean;
  explainable: boolean;
  tenant_isolated: boolean;
  governance_aware_visibility: boolean;
  role_based_access_control: boolean;
  evidence_traceable: boolean;
  observational_only: true;
  modifies_feedback: false;
  generates_adaptive_proposals: false;
  changes_recommendations: false;
  executes_simulations: false;
  overrides_governance: false;
  approves_adaptations: false;
  changes_production_behavior: false;
}>;

export type FeedbackAnalyticsDashboardFoundation = Readonly<{
  feedback_analytics_dashboard_version: "feedback-analytics-dashboard/v1";
  api_surface: FeedbackDashboardApiSurface;
  result: FeedbackAnalyticsDashboardResult;
}>;
