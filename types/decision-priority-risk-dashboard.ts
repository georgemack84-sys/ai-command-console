import type { ConflictDependencyVisualizationResult } from "@/types/decision-conflict-dependency-visualization";
import type { DecisionDashboardLifecycleState, DecisionPriorityBand } from "@/types/decision-state-dashboard";
import type { VisibilityRole } from "@/types/decision-observability-contract";

export type PriorityQueueType = "MISSION_CRITICAL" | "CRITICAL" | "HIGH_PRIORITY" | "MEDIUM_PRIORITY" | "LOW_PRIORITY" | "DEFERRED" | "BLOCKED" | "ESCALATED";
export type RiskCategory = "CRITICAL" | "HIGH" | "ELEVATED" | "MODERATE" | "LOW" | "INFORMATIONAL";
export type ConfidenceCategory = "VERY_HIGH" | "HIGH" | "MODERATE" | "LOW" | "VERY_LOW" | "UNKNOWN";
export type UrgencyLevel = "IMMEDIATE" | "CRITICAL" | "HIGH" | "NORMAL" | "LOW" | "DEFERRED";

export type PriorityRiskDashboardFailure =
  | "PRIORITY_ORDER_MISMATCH"
  | "MISSION_CRITICAL_DECISIONS_OMITTED"
  | "RISK_EXPOSURE_INACCURATE"
  | "CONFIDENCE_SOURCE_MISMATCH"
  | "URGENCY_INDICATORS_INCORRECT"
  | "QUEUE_ANALYTICS_INCONSISTENT"
  | "GOVERNANCE_PRIORITY_ADJUSTMENTS_HIDDEN"
  | "REPLAY_REFERENCES_MISSING"
  | "CERTIFICATION_BLOCKERS_HIDDEN"
  | "DASHBOARD_ORDER_NONDETERMINISTIC"
  | "CROSS_TENANT_QUEUE_VISIBLE"
  | "INTEGRITY_HASH_MISMATCH"
  | "DASHBOARD_REPLAY_RECONSTRUCTION_FAILED"
  | "AUTHORIZATION_FAILURE"
  | "EXECUTION_AUTHORITY_GRANTED";

export type PriorityQueueItem = Readonly<{
  queue_item_id: string;
  decision_id: string;
  priority_score: number;
  mission_priority: number;
  governance_weight: number;
  constitutional_weight: number;
  risk_score: number;
  confidence_score: number;
  urgency_score: number;
  lifecycle_state: DecisionDashboardLifecycleState;
  priority_band: DecisionPriorityBand;
  queue_type: PriorityQueueType;
  queue_position: number;
  tenant_id: string;
  mission_id: string;
  replay_ref: string;
  integrity_hash: string;
}>;

export type PriorityQueueRecord = Readonly<{
  queue_record_id: string;
  queue_type: PriorityQueueType;
  tenant_id: string;
  mission_id: string;
  decision_refs: readonly string[];
  queue_positions: readonly number[];
  priority_scores: readonly number[];
  governance_weight: number;
  risk_score: number;
  confidence_score: number;
  urgency_score: number;
  replay_ref: string;
  integrity_hash: string;
}>;

export type RiskDashboardRecord = Readonly<{
  risk_dashboard_id: string;
  tenant_id: string;
  mission_id: string;
  decision_refs: readonly string[];
  overall_risk: RiskCategory;
  risk_distribution: Readonly<Record<RiskCategory, number>>;
  governance_risk: RiskCategory;
  constitutional_risk: RiskCategory;
  operational_risk: RiskCategory;
  replay_risk: RiskCategory;
  certification_risk: RiskCategory;
  integrity_hash: string;
}>;

export type ConfidenceDashboard = Readonly<{
  confidence_dashboard_id: string;
  tenant_id: string;
  mission_id: string;
  confidence_distribution: Readonly<Record<ConfidenceCategory, number>>;
  evidence_quality: "COMPLETE" | "PARTIAL" | "MISSING";
  uncertainty_distribution: Readonly<Record<ConfidenceCategory, number>>;
  confidence_lineage: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type UrgencyVisualization = Readonly<{
  urgency_dashboard_id: string;
  tenant_id: string;
  mission_id: string;
  urgency_levels: Readonly<Record<UrgencyLevel, readonly string[]>>;
  deadline_refs: readonly string[];
  escalation_timers: readonly string[];
  aging_indicators: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type QueueAnalytics = Readonly<{
  analytics_id: string;
  tenant_id: string;
  mission_id: string;
  throughput_metrics: Readonly<{ completed: number; decisions_per_hour: number; average_completion_minutes: number }>;
  queue_metrics: Readonly<{ queue_depth: number; backlog: number; bottlenecks: readonly string[]; congestion: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" }>;
  risk_metrics: Readonly<{ aggregate_risk: number; high_risk_concentration: number; risk_trend: "STABLE" | "RISING" | "FALLING"; unresolved_risk: number }>;
  confidence_metrics: Readonly<{ average_confidence: number; low_confidence_percentage: number; confidence_degradation: number; evidence_quality_trend: "STABLE" | "DEGRADED" }>;
  governance_metrics: Readonly<{ governance_escalations: number; constitutional_reviews: number; authority_conflicts: number; certification_blockers: number }>;
  replay_metrics: Readonly<{ replay_refs: number; replay_ready_percentage: number; replay_failures: number }>;
  integrity_hash: string;
}>;

export type PriorityDashboardRecord = Readonly<{
  dashboard_id: string;
  tenant_id: string;
  mission_id: string;
  queue_refs: readonly string[];
  risk_dashboard_ref: string;
  confidence_dashboard_ref: string;
  urgency_dashboard_ref: string;
  analytics_ref: string;
  replay_ref: string;
  certification_ref: string;
  integrity_hash: string;
}>;

export type PriorityRiskDashboardValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  priority_order_valid: boolean;
  mission_critical_visible: boolean;
  risk_exposure_valid: boolean;
  confidence_lineage_valid: boolean;
  urgency_indicators_valid: boolean;
  analytics_consistent: boolean;
  governance_adjustments_visible: boolean;
  replay_refs_present: boolean;
  certification_blockers_visible: boolean;
  deterministic_ordering: boolean;
  tenant_isolated: boolean;
  authorization_valid: boolean;
  integrity_verified: boolean;
  advisory_only: boolean;
  failures: readonly PriorityRiskDashboardFailure[];
  integrity_hash: string;
}>;

export type PriorityRiskDashboardInput = Readonly<{
  conflict_visualization?: ConflictDependencyVisualizationResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "ORDER_MISMATCH"
    | "OMIT_MISSION_CRITICAL"
    | "BAD_RISK"
    | "BAD_CONFIDENCE"
    | "BAD_URGENCY"
    | "BAD_ANALYTICS"
    | "HIDE_GOVERNANCE_ADJUSTMENTS"
    | "MISSING_REPLAY_REFS"
    | "HIDE_CERTIFICATION_BLOCKERS"
    | "NONDETERMINISTIC_ORDER"
    | "CROSS_TENANT"
    | "HASH_MISMATCH"
    | "REPLAY_RECONSTRUCTION_FAILURE"
    | "UNAUTHORIZED_ROLE"
    | "EXECUTION_AUTHORITY";
}>;

export type PriorityRiskDashboardResult = Readonly<{
  dashboard_version: "decision-priority-risk-dashboard/v1";
  conflict_visualization: ConflictDependencyVisualizationResult;
  queue_items: readonly PriorityQueueItem[];
  priority_queues: readonly PriorityQueueRecord[];
  mission_critical_queue: PriorityQueueRecord;
  risk_dashboard: RiskDashboardRecord;
  confidence_dashboard: ConfidenceDashboard;
  urgency_visualization: UrgencyVisualization;
  queue_analytics: QueueAnalytics;
  dashboard_record: PriorityDashboardRecord;
  validation: PriorityRiskDashboardValidation;
  deterministic: true;
  advisory_only: true;
  mutates_priority_or_risk: false;
  execution_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type PriorityRiskDashboardFoundation = Readonly<{
  dashboard_version: "decision-priority-risk-dashboard/v1";
  queue_types: readonly PriorityQueueType[];
  risk_categories: readonly RiskCategory[];
  confidence_categories: readonly ConfidenceCategory[];
  urgency_levels: readonly UrgencyLevel[];
  result: PriorityRiskDashboardResult;
}>;
