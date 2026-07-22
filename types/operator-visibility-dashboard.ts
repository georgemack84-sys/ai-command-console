import type { WorkflowAuditReplayResult } from "@/types/workflow-audit-replay";

export type DashboardSection =
  | "WORKFLOW_STATUS"
  | "RECOMMENDATION_SUMMARY"
  | "GOVERNANCE"
  | "OPERATOR_ACTIVITY"
  | "REPLAY"
  | "WORKFLOW_TIMELINE";

export type WorkflowStatusView = Readonly<{
  workflow_id: string;
  current_state: string;
  time_in_state: string;
  pending_actions: readonly string[];
  blocking_conditions: readonly string[];
  replay_ref: string;
  integrity_hash: string;
}>;

export type RecommendationSummaryView = Readonly<{
  workflow_id: string;
  recommended_decision: string;
  alternatives: readonly string[];
  risks: readonly string[];
  confidence: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  integrity_hash: string;
}>;

export type GovernanceSummaryView = Readonly<{
  workflow_id: string;
  policy_status: "VISIBLE" | "MISSING";
  constitutional_status: "VISIBLE" | "MISSING";
  authority_required: string;
  certifications: readonly string[];
  integrity_hash: string;
}>;

export type OperatorActivityView = Readonly<{
  workflow_id: string;
  approvals: readonly string[];
  rejections: readonly string[];
  deferrals: readonly string[];
  overrides: readonly string[];
  escalations: readonly string[];
  timeline_ref: string;
  integrity_hash: string;
}>;

export type WorkflowTimelineView = Readonly<{
  workflow_id: string;
  ordered_events: readonly string[];
  evidence_chain: readonly string[];
  lineage_chain: readonly string[];
  replay_ref: string;
  integrity_hash: string;
}>;

export type ReplaySummaryView = Readonly<{
  workflow_id: string;
  replay_status: "CERTIFIED" | "REJECTED";
  reconstructed_state: string;
  replay_event_count: number;
  replay_ref: string;
  integrity_hash: string;
}>;

export type DashboardViewModel = Readonly<{
  dashboard_id: string;
  workflow_id: string;
  tenant_id: string;
  current_state: string;
  workflow_summary: WorkflowStatusView;
  recommendation_summary: RecommendationSummaryView;
  governance_summary: GovernanceSummaryView;
  operator_activity: OperatorActivityView;
  replay_summary: ReplaySummaryView;
  timeline_view: WorkflowTimelineView;
  generated_at: string;
  read_only: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type DashboardStatusApiResponse = Readonly<{
  api_id: string;
  workflow_id: string;
  authorized_operator: string;
  authority_level: string;
  sections: readonly DashboardSection[];
  dashboard: DashboardViewModel;
  replay_ref: string;
  read_only: true;
  integrity_hash: string;
}>;

export type OperatorVisibilityDashboardFailureReason =
  | "WORKFLOW_DATA_UNAVAILABLE"
  | "WORKFLOW_STATE_INVALID"
  | "RECOMMENDATION_INCOMPLETE"
  | "GOVERNANCE_STATUS_UNAVAILABLE"
  | "CONSTITUTIONAL_STATUS_UNAVAILABLE"
  | "REPLAY_HISTORY_INCOMPLETE"
  | "TIMELINE_INCONSISTENT"
  | "LINEAGE_INCOMPLETE"
  | "AUTHORIZATION_FAILED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "TENANT_MISMATCH"
  | "AUDIT_REPLAY_FAILED"
  | "READ_ONLY_VIOLATION"
  | "ADVISORY_ONLY_VIOLATION"
  | "REPLAY_DIVERGENCE";

export type OperatorVisibilityDashboardValidation = Readonly<{
  validation_id: string;
  workflow_id: string;
  workflow_data_available: boolean;
  workflow_state_valid: boolean;
  recommendation_complete: boolean;
  governance_visible: boolean;
  constitutional_visible: boolean;
  replay_complete: boolean;
  timeline_consistent: boolean;
  lineage_complete: boolean;
  authorized: boolean;
  tenant_valid: boolean;
  read_only_valid: boolean;
  advisory_only_valid: boolean;
  integrity_valid: boolean;
  validation_status: "VALID" | "REJECTED";
  validation_timestamp: string;
  failures: readonly OperatorVisibilityDashboardFailureReason[];
  integrity_hash: string;
}>;

export type OperatorVisibilityDashboardInput = Readonly<{
  audit_result?: WorkflowAuditReplayResult;
  workflow_status?: WorkflowStatusView;
  recommendation_summary?: RecommendationSummaryView;
  governance_summary?: GovernanceSummaryView;
  operator_activity?: OperatorActivityView;
  replay_summary?: ReplaySummaryView;
  timeline_view?: WorkflowTimelineView;
  dashboard?: DashboardViewModel;
  status_api?: DashboardStatusApiResponse;
  requesting_tenant_id?: string;
  authorized_operator?: string;
  authority_level?: string;
  replay_expected_hash?: string;
}>;

export type OperatorVisibilityDashboardResult = Readonly<{
  dashboard_status: "PASS" | "FAIL";
  fail_closed: boolean;
  audit_result: WorkflowAuditReplayResult;
  workflow_status: WorkflowStatusView;
  recommendation_summary: RecommendationSummaryView;
  governance_summary: GovernanceSummaryView;
  operator_activity: OperatorActivityView;
  replay_summary: ReplaySummaryView;
  timeline_view: WorkflowTimelineView;
  dashboard: DashboardViewModel;
  status_api: DashboardStatusApiResponse;
  validation: OperatorVisibilityDashboardValidation;
  replay_hash: string;
  failures: readonly OperatorVisibilityDashboardFailureReason[];
  deterministic: true;
  read_only: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type OperatorVisibilityDashboardReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  workflow_id: string;
  dashboard_id: string;
  current_state: string;
  rendered_sections: readonly DashboardSection[];
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly OperatorVisibilityDashboardFailureReason[];
  integrity_hash: string;
}>;

export type OperatorVisibilityDashboardObservability = Readonly<{
  dashboards_generated: number;
  status_views_generated: number;
  recommendation_views_generated: number;
  governance_views_generated: number;
  operator_activity_views_generated: number;
  replay_views_generated: number;
  timeline_views_generated: number;
  validation_failures: number;
  replay_reproducibility: number;
  integrity_verification_success: number;
  fail_closed_activations: number;
}>;

export type OperatorVisibilityDashboardFoundation = Readonly<{
  dashboard_version: "operator-visibility-dashboard/v1";
  sections: readonly DashboardSection[];
  result: OperatorVisibilityDashboardResult;
  replay: OperatorVisibilityDashboardReplay;
  observability: OperatorVisibilityDashboardObservability;
}>;
