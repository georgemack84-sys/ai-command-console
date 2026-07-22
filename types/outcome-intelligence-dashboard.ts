import type { AdaptiveDashboardResult, DashboardRole } from "@/types/adaptive-dashboard-foundation";
import type { OutcomeObservationEngineResult } from "@/types/outcome-observation-engine";
import type { OutcomeObservationLedgerResult } from "@/types/outcome-observation-ledger";

export type OutcomeDashboardStatus = "AUTHORITATIVE" | "REJECTED";
export type OutcomeDashboardValidationOutcome = "VALID" | "INVALID";
export type OutcomeCategory = "Success" | "Partial Success" | "Failure" | "Governance Blocked" | "Operator Rejected" | "Simulation Failed" | "Rollback Executed" | "Certification Blocked" | "Escalated" | "Deferred";
export type OutcomeSeverity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type OutcomeTrendDirection = "IMPROVING" | "STABLE" | "DECLINING";
export type OutcomeDashboardWidget = "Success Rate" | "Failure Timeline" | "Mission Impact" | "Confidence Accuracy" | "Risk Actualization" | "Outcome Distribution" | "Outcome History" | "Rollback Timeline" | "Governance Replay" | "Historical Comparison";

export type OutcomeDashboardScenario =
  | "BASELINE"
  | "FOUNDATION_UNAVAILABLE"
  | "OUTCOME_HIDDEN"
  | "OUTCOME_OMITTED"
  | "NONDETERMINISTIC_RENDERING"
  | "MISSING_EVIDENCE"
  | "MISSING_REPLAY"
  | "MISSING_GOVERNANCE"
  | "ROLLBACK_HISTORY_MISSING"
  | "COMPARISON_DRIFT"
  | "STALE_VISUALIZATION"
  | "UNAUTHORIZED_ROLE"
  | "TENANT_LEAK"
  | "RESTRICTED_FIELD_LEAK"
  | "INTEGRITY_FAILURE"
  | "WRITE_AUTHORITY_EXPOSED";

export type OutcomeDashboardFailure =
  | "DASHBOARD_FOUNDATION_UNAVAILABLE"
  | "OUTCOME_RECORD_HIDDEN"
  | "OUTCOME_RECORD_OMITTED"
  | "OUTCOME_RENDERING_NONDETERMINISTIC"
  | "EVIDENCE_REFERENCE_BROKEN"
  | "REPLAY_REFERENCE_MISSING"
  | "GOVERNANCE_LINEAGE_MISSING"
  | "ROLLBACK_HISTORY_MISSING"
  | "HISTORICAL_COMPARISON_NONDETERMINISTIC"
  | "STALE_VISUALIZATION_DETECTED"
  | "UNAUTHORIZED_DASHBOARD_ACCESS"
  | "TENANT_ISOLATION_VIOLATED"
  | "RESTRICTED_FIELD_EXPOSED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "DASHBOARD_WRITE_AUTHORITY_EXPOSED";

export type OutcomeRecordView = Readonly<{
  outcome_view_id: string;
  tenant_id: string;
  mission_id: string;
  outcome_id: string;
  completion_status: string;
  observed_outcome: OutcomeCategory;
  outcome_severity: OutcomeSeverity;
  mission_owner: string;
  completion_time: string;
  associated_recommendations: readonly string[];
  governance_state: string;
  certification_status: "CERTIFIED" | "PENDING" | "BLOCKED";
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type OutcomeTimelineEvent = Readonly<{
  event_id: string;
  outcome_id: string;
  mission_id: string;
  timestamp: string;
  event_type: "OBSERVED" | "GOVERNANCE_REVIEWED" | "CONFIDENCE_REALIZED" | "RISK_REALIZED" | "ROLLBACK_RECORDED" | "CERTIFIED";
  summary: string;
  evidence_refs: readonly string[];
  replay_ref: string;
  integrity_hash: string;
}>;

export type OutcomeTrendAnalytics = Readonly<{
  analytics_id: string;
  successful_missions: number;
  failed_missions: number;
  success_percentage: number;
  failure_percentage: number;
  trend_direction: OutcomeTrendDirection;
  recurring_improvements: readonly string[];
  recurring_failures: readonly string[];
  success_by_tenant: readonly string[];
  success_by_mission_type: readonly string[];
  integrity_hash: string;
}>;

export type MissionImpactDashboard = Readonly<{
  impact_id: string;
  operational_improvement: number;
  efficiency_change: number;
  resource_utilization_delta: number;
  objective_completion: number;
  mission_delays: number;
  mission_degradation: number;
  downstream_impact_refs: readonly string[];
  cross_mission_effect_refs: readonly string[];
  integrity_hash: string;
}>;

export type OutcomeCategorySummary = Readonly<{
  category_id: string;
  categories: readonly OutcomeCategory[];
  category_counts: readonly string[];
  category_trends: readonly string[];
  mission_groupings: readonly string[];
  historical_comparisons: readonly string[];
  integrity_hash: string;
}>;

export type ConfidenceRealizationDashboard = Readonly<{
  confidence_id: string;
  predicted_confidence: number;
  actual_confidence_realization: number;
  confidence_calibration: number;
  confidence_drift: number;
  confidence_error: number;
  overconfidence: number;
  underconfidence: number;
  integrity_hash: string;
}>;

export type RiskRealizationDashboard = Readonly<{
  risk_id: string;
  predicted_risk: number;
  realized_risk: number;
  underestimated_risks: number;
  overestimated_risks: number;
  realized_severity: OutcomeSeverity;
  realized_probability: number;
  mitigation_effectiveness: number;
  integrity_hash: string;
}>;

export type GovernanceOutcomeDashboard = Readonly<{
  governance_id: string;
  governance_approvals: number;
  governance_rejections: number;
  constitutional_reviews: number;
  policy_violations: number;
  governance_escalations: number;
  authority_decisions: readonly string[];
  governance_impact_refs: readonly string[];
  approval_lineage_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type RollbackOutcomeDashboard = Readonly<{
  rollback_id: string;
  rollback_events: number;
  rollback_reasons: readonly string[];
  rollback_success: boolean;
  rollback_duration_ms: number;
  rollback_completeness: number;
  rollback_replay_refs: readonly string[];
  rollback_certification_refs: readonly string[];
  integrity_hash: string;
}>;

export type HistoricalComparisonExplorer = Readonly<{
  comparison_id: string;
  dimensions: readonly string[];
  period_comparison_refs: readonly string[];
  trend_analysis_refs: readonly string[];
  baseline_comparison_refs: readonly string[];
  historical_replay_refs: readonly string[];
  improvement_tracking_refs: readonly string[];
  deterministic: boolean;
  integrity_hash: string;
}>;

export type OutcomeReplayIntegration = Readonly<{
  replay_id: string;
  outcome_id: string;
  evidence_lineage_ref: string;
  governance_lineage_ref: string;
  certification_record_ref: string;
  outcome_ledger_ref: string;
  truth_ledger_ref: string;
  replayable: boolean;
  integrity_hash: string;
}>;

export type OutcomeDashboardPermission = Readonly<{
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

export type OutcomeDashboardMetrics = Readonly<{
  rendering_health: "HEALTHY" | "DEGRADED";
  missing_outcome_records: number;
  stale_visualizations: number;
  broken_evidence_references: number;
  replay_resolution_failures: number;
  navigation_failures: number;
  integrity_verification_failures: number;
  unauthorized_access_attempts: number;
  data_sync_latency_ms: number;
  integrity_hash: string;
}>;

export type OutcomeDashboardValidationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: "PASS" | "FAIL";
  passed: boolean;
  failure_reason: OutcomeDashboardFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type OutcomeDashboardApiSurface = Readonly<{
  api_id: string;
  retrieve_dashboard: "POST /outcome-intelligence-dashboard/dashboard";
  retrieve_contract: "GET /outcome-intelligence-dashboard/contract";
  retrieve_recent: "POST /outcome-intelligence-dashboard/recent";
  retrieve_success: "POST /outcome-intelligence-dashboard/success";
  retrieve_failure: "POST /outcome-intelligence-dashboard/failure";
  retrieve_impact: "POST /outcome-intelligence-dashboard/impact";
  retrieve_categories: "POST /outcome-intelligence-dashboard/categories";
  retrieve_confidence: "POST /outcome-intelligence-dashboard/confidence";
  retrieve_risk: "POST /outcome-intelligence-dashboard/risk";
  retrieve_governance: "POST /outcome-intelligence-dashboard/governance";
  retrieve_rollback: "POST /outcome-intelligence-dashboard/rollback";
  retrieve_comparison: "POST /outcome-intelligence-dashboard/comparison";
  retrieve_replay: "POST /outcome-intelligence-dashboard/replay";
  validate_dashboard: "POST /outcome-intelligence-dashboard/validate";
  inspect_dashboard: "POST /outcome-intelligence-dashboard/inspect";
  mutation_supported: false;
  recalculation_supported: false;
  governance_decision_supported: false;
  integrity_hash: string;
}>;

export type OutcomeDashboardInput = Readonly<{
  scenario?: OutcomeDashboardScenario;
  role?: DashboardRole;
  tenant_id?: string;
}>;

export type OutcomeDashboardResult = Readonly<{
  outcome_intelligence_dashboard_version: "outcome-intelligence-dashboard/v10.14.2";
  dashboard_identifier: "OutcomeIntelligenceDashboard";
  status: OutcomeDashboardStatus;
  api_surface: OutcomeDashboardApiSurface;
  dashboard_foundation: AdaptiveDashboardResult;
  outcome_engine_result: OutcomeObservationEngineResult;
  outcome_ledger_result: OutcomeObservationLedgerResult;
  recent_outcomes: readonly OutcomeRecordView[];
  timeline_explorer: readonly OutcomeTimelineEvent[];
  success_trends: OutcomeTrendAnalytics;
  failure_trends: OutcomeTrendAnalytics;
  mission_impact: MissionImpactDashboard;
  outcome_categories: OutcomeCategorySummary;
  confidence_realization: ConfidenceRealizationDashboard;
  risk_realization: RiskRealizationDashboard;
  governance_outcomes: GovernanceOutcomeDashboard;
  rollback_outcomes: RollbackOutcomeDashboard;
  historical_comparison: HistoricalComparisonExplorer;
  replay_integration: readonly OutcomeReplayIntegration[];
  permissions: readonly OutcomeDashboardPermission[];
  widgets: readonly OutcomeDashboardWidget[];
  metrics: OutcomeDashboardMetrics;
  validation_tests: readonly OutcomeDashboardValidationTest[];
  validation_outcome: OutcomeDashboardValidationOutcome;
  failures: readonly OutcomeDashboardFailure[];
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

export type OutcomeDashboardValidationResult = Readonly<{
  dashboard_id: string | null;
  valid: boolean;
  validation_outcome: OutcomeDashboardValidationOutcome;
  failures: readonly OutcomeDashboardFailure[];
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  read_only: boolean;
  validation_hash: string;
}>;

export type OutcomeDashboardObservabilitySurface = Readonly<{
  dashboard_id: string;
  status: OutcomeDashboardStatus;
  validation_outcome: OutcomeDashboardValidationOutcome;
  outcomes: number;
  timeline_events: number;
  failed_tests: number;
  failures: readonly OutcomeDashboardFailure[];
  rendering_health: "HEALTHY" | "DEGRADED";
  replayable: boolean;
  tenant_isolated: boolean;
  read_only: boolean;
  integrity_hash: string;
}>;

export type OutcomeDashboardContract = Readonly<{
  doctrine: Readonly<{
    version: "outcome-intelligence-dashboard/v10.14.2";
    widgets: readonly OutcomeDashboardWidget[];
    outcome_categories: readonly OutcomeCategory[];
    navigation_dimensions: readonly string[];
    required_data_sources: readonly string[];
    read_only: true;
    advisory_only: true;
  }>;
  result: OutcomeDashboardResult;
  validation: OutcomeDashboardValidationResult;
  observability: OutcomeDashboardObservabilitySurface;
}>;
