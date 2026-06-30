import type { GovernanceQueryCertificationStatus } from "@/types/governance-query-certification";

export type GovernanceDashboardWidgetType =
  | "GOVERNANCE_HEALTH"
  | "COMPLIANCE_SCORE"
  | "RISK_SCORE"
  | "RECOMMENDATIONS"
  | "ESCALATIONS"
  | "POLICY_COMPLIANCE"
  | "CONSTITUTIONAL_COMPLIANCE"
  | "AUTHORITY_COMPLIANCE"
  | "GOVERNANCE_TRENDS"
  | "ALERTS"
  | "REPLAY_STATUS"
  | "INTEGRITY_STATUS"
  | "CERTIFICATION_STATUS"
  | "MISSION_HEALTH"
  | "TENANT_HEALTH"
  | "HISTORICAL_TIMELINE";

export type GovernanceDashboardState = "HEALTHY" | "WATCH" | "DEGRADED" | "BLOCKED";
export type GovernanceDashboardReplayState = "VERIFIED" | "AVAILABLE" | "PENDING" | "FAILED";
export type GovernanceDashboardNotificationPriority = "INFORMATIONAL" | "ADVISORY" | "WARNING" | "CRITICAL";
export type GovernanceDashboardAction =
  | "MODIFY_POLICY"
  | "APPROVE_RECOMMENDATION"
  | "EXECUTE_RECOMMENDATION"
  | "OVERRIDE_GOVERNANCE"
  | "ALTER_REPLAY"
  | "MODIFY_INTEGRITY";

export type GovernanceDashboardInput = Readonly<{
  tenant_id?: string;
  mission_id?: string;
  operator_id?: string;
  certification_status?: GovernanceQueryCertificationStatus;
}>;

export type GovernanceDashboardMetric = Readonly<{
  label: string;
  value: string | number;
  state: GovernanceDashboardState;
  explanation: string;
  evidence_refs: readonly string[];
}>;

export type GovernanceDashboardWidget = Readonly<{
  widget_id: string;
  type: GovernanceDashboardWidgetType;
  title: string;
  value: string | number;
  state: GovernanceDashboardState;
  order: number;
  replay_ref: string;
  certification_ref: string;
  immutable_timestamp: string;
  widget_hash: string;
}>;

export type GovernanceDashboardRecommendation = Readonly<{
  recommendation_id: string;
  recommendation_type: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  status: "VISIBLE" | "PENDING_REVIEW" | "CERTIFIED";
  supporting_evidence: readonly string[];
  policy_refs: readonly string[];
  risk_refs: readonly string[];
  compliance_refs: readonly string[];
  lineage_refs: readonly string[];
  advisory_disclaimer: "Advisory-only. Execution authority is not available from the dashboard.";
}>;

export type GovernanceDashboardEscalation = Readonly<{
  escalation_id: string;
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  trigger_reason: string;
  routing_destination: string;
  resolution_status: "OPEN" | "MONITORING" | "RESOLVED";
  confidence: number;
  required_operator_actions: readonly string[];
}>;

export type GovernanceDashboardTrendPoint = Readonly<{
  timestamp: string;
  governance_health: number;
  compliance_score: number;
  risk_score: number;
  recommendation_volume: number;
  escalation_frequency: number;
  replay_success: number;
  certification_status: GovernanceQueryCertificationStatus;
}>;

export type GovernanceDashboardNotification = Readonly<{
  notification_id: string;
  priority: GovernanceDashboardNotificationPriority;
  type: "NEW_RECOMMENDATION" | "COMPLIANCE_DEGRADATION" | "RISK_INCREASE" | "ESCALATION_CREATED" | "REPLAY_FAILURE" | "INTEGRITY_FAILURE" | "CERTIFICATION_FAILURE" | "POLICY_CONFLICT";
  message: string;
  evidence_refs: readonly string[];
  created_at: string;
}>;

export type GovernanceDashboardSummary = Readonly<{
  tenant_id: string;
  mission_id: string;
  mission_state: "ACTIVE" | "REVIEW" | "BLOCKED";
  mission_lifecycle: "EVALUATED" | "CERTIFIED" | "WATCH";
  governance_status: GovernanceDashboardState;
  governance_health_score: number;
  active_governance_issues: number;
  overall_confidence: number;
  replay_available: boolean;
  certification_status: GovernanceQueryCertificationStatus;
  last_governance_evaluation: string;
}>;

export type GovernanceDashboardTenantSummary = Readonly<{
  tenant_id: string;
  active_missions: number;
  certified_missions: number;
  pending_governance_reviews: number;
  tenant_compliance_score: number;
  aggregate_governance_risk: number;
  active_escalations: number;
  replay_coverage: number;
  integrity_status: "VALID" | "DEGRADED" | "CORRUPTED";
}>;

export type GovernanceDashboardView = Readonly<{
  dashboard_id: string;
  schema_version: "governance-dashboard/v7K.1";
  tenant_id: string;
  mission_id: string;
  operator_id: string;
  read_only: true;
  advisory_only: true;
  mutation_allowed: false;
  approval_allowed: false;
  execution_allowed: false;
  tenant_isolated: boolean;
  authorization_enforced: boolean;
  deterministic_ordering: readonly GovernanceDashboardWidgetType[];
  mission_summary: GovernanceDashboardSummary;
  tenant_summary: GovernanceDashboardTenantSummary;
  governance_summary: readonly GovernanceDashboardMetric[];
  recommendations: readonly GovernanceDashboardRecommendation[];
  compliance: readonly GovernanceDashboardMetric[];
  risks: readonly GovernanceDashboardMetric[];
  escalations: readonly GovernanceDashboardEscalation[];
  historical_trends: readonly GovernanceDashboardTrendPoint[];
  notifications: readonly GovernanceDashboardNotification[];
  replay_status: Readonly<{
    state: GovernanceDashboardReplayState;
    replay_hash: string;
    last_replay_timestamp: string;
    reconstruction_status: "COMPLETE" | "PARTIAL" | "FAILED";
    replay_consistency: boolean;
  }>;
  certification_status: Readonly<{
    state: GovernanceQueryCertificationStatus;
    certification_id: string;
    certification_hash: string;
    outstanding_issues: readonly string[];
  }>;
  widgets: readonly GovernanceDashboardWidget[];
  dashboard_hash: string;
}>;

export type GovernanceDashboardObservabilitySurface = Readonly<{
  dashboard_id: string;
  tenant_id: string;
  mission_id: string;
  widget_count: number;
  notification_count: number;
  governance_status: GovernanceDashboardState;
  certification_status: GovernanceQueryCertificationStatus;
  read_only: true;
  dashboard_hash: string;
}>;
