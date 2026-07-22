import type { OperatorActivityDashboardResult } from "@/types/decision-operator-activity-dashboard";
import type { VisibilityRole } from "@/types/decision-observability-contract";

export type AnalyticsWindow = "MISSION" | "HOURLY" | "DAILY" | "OPERATOR_SESSION";
export type BottleneckSeverity = "INFORMATIONAL" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type TrendDirection = "IMPROVING" | "STABLE" | "DEGRADING" | "VOLATILE" | "INSUFFICIENT_DATA";
export type OperationalHealthState = "HEALTHY" | "WATCH" | "DEGRADED" | "CRITICAL" | "UNKNOWN";
export type AnalyticsSignalType = "THROUGHPUT" | "BOTTLENECK" | "GOVERNANCE" | "OPERATOR" | "REPLAY" | "CERTIFICATION" | "RISK" | "CONFIDENCE";

export type ObservabilityAnalyticsFailure =
  | "ANALYTICS_NONDETERMINISTIC"
  | "THROUGHPUT_CALCULATION_INCONSISTENT"
  | "BOTTLENECKS_MISSED"
  | "TRENDS_FABRICATED"
  | "MISSING_DATA_TREATED_AS_ZERO"
  | "GOVERNANCE_DELAYS_SUPPRESSED"
  | "REPLAY_FAILURES_EXCLUDED"
  | "CERTIFICATION_BLOCKERS_OMITTED"
  | "SOURCE_LINEAGE_INCOMPLETE"
  | "ANALYTICS_LEDGER_MUTABLE"
  | "CROSS_TENANT_ANALYTICS_VISIBLE"
  | "INTEGRITY_HASH_MISMATCH"
  | "ANALYTICS_REPLAY_RECONSTRUCTION_FAILED"
  | "AUTHORIZATION_FAILURE"
  | "EXECUTION_AUTHORITY_GRANTED";

export type AnalyticsMetricRecord = Readonly<{
  metric_id: string;
  tenant_id: string;
  mission_id: string;
  metric_name: string;
  metric_value: number | null;
  metric_unit: "count" | "percentage" | "minutes" | "score" | "ratio";
  measurement_window: AnalyticsWindow;
  missing_data: boolean;
  source_refs: readonly string[];
  calculation_version: "observability-analytics-calc/v1";
  replay_ref: string;
  integrity_hash: string;
}>;

export type DecisionAnalyticsRecord = Readonly<{
  analytics_id: string;
  tenant_id: string;
  mission_id: string;
  analytics_window: AnalyticsWindow;
  source_dashboard_refs: readonly string[];
  metric_set_refs: readonly string[];
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  integrity_hash: string;
}>;

export type ThroughputMetrics = Readonly<{
  throughput_id: string;
  tenant_id: string;
  mission_id: string;
  measurement_window: AnalyticsWindow;
  decisions_in: number;
  decisions_completed: number;
  decisions_blocked: number;
  decisions_escalated: number;
  decisions_deferred: number;
  average_cycle_time: number;
  completion_rate: number;
  stage_transition_time: number;
  replay_ref: string;
  integrity_hash: string;
}>;

export type BottleneckRecord = Readonly<{
  bottleneck_id: string;
  tenant_id: string;
  mission_id: string;
  bottleneck_type: "QUEUE_CONGESTION" | "GOVERNANCE_DELAY" | "OPERATOR_APPROVAL_DELAY" | "REPLAY_VALIDATION_DELAY" | "CERTIFICATION_BLOCKER" | "DEPENDENCY_BLOCKER" | "CONFLICT_RESOLUTION_DELAY" | "EVIDENCE_GAP" | "LOW_CONFIDENCE_STALL";
  affected_decision_refs: readonly string[];
  affected_stage: string;
  severity: BottleneckSeverity;
  detected_at: string;
  duration: number;
  root_cause_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type TrendAnalysisRecord = Readonly<{
  trend_id: string;
  tenant_id: string;
  mission_id: string;
  metric_name: string;
  measurement_window: AnalyticsWindow;
  time_series_points: readonly number[];
  trend_direction: TrendDirection;
  confidence_quality: "HIGH" | "MODERATE" | "LOW" | "MISSING";
  source_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type OperationalHealthDashboard = Readonly<{
  health_dashboard_id: string;
  tenant_id: string;
  mission_id: string;
  health_state: OperationalHealthState;
  health_score: number;
  throughput_summary: string;
  bottleneck_summary: string;
  governance_summary: string;
  operator_summary: string;
  replay_summary: string;
  certification_summary: string;
  risk_summary: string;
  confidence_summary: string;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type AnalyticsSourceSnapshot = Readonly<{
  snapshot_id: string;
  tenant_id: string;
  mission_id: string;
  source_dashboard_refs: readonly string[];
  source_ledger_refs: readonly string[];
  event_count: number;
  measurement_window: AnalyticsWindow;
  snapshot_hash: string;
  replay_ref: string;
}>;

export type HealthSignalRecord = Readonly<{
  health_signal_id: string;
  tenant_id: string;
  mission_id: string;
  signal_type: AnalyticsSignalType;
  signal_value: number | null;
  signal_state: OperationalHealthState;
  source_refs: readonly string[];
  replay_ref: string;
  integrity_hash: string;
}>;

export type AnalyticsLedgerRecord = Readonly<{
  analytics_ledger_id: string;
  tenant_id: string;
  mission_id: string;
  event_type: "ANALYTICS_JOB_CREATED" | "ANALYTICS_INPUT_COLLECTED" | "METRIC_CALCULATED" | "THROUGHPUT_MEASURED" | "BOTTLENECK_DETECTED" | "BOTTLENECK_RESOLVED" | "TREND_CALCULATED" | "HEALTH_SCORE_CALCULATED" | "ANALYTICS_RECOMPUTED" | "ANALYTICS_ARCHIVED";
  analytics_type: "DECISION" | "THROUGHPUT" | "BOTTLENECK" | "TREND" | "HEALTH";
  metric_name: string;
  source_refs: readonly string[];
  calculation_version: "observability-analytics-calc/v1";
  result_ref: string;
  replay_refs: readonly string[];
  event_timestamp: string;
  sequence_number: number;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type ObservabilityAnalyticsValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  deterministic_analytics: boolean;
  throughput_consistent: boolean;
  bottlenecks_detected: boolean;
  trends_not_fabricated: boolean;
  missing_data_preserved: boolean;
  governance_delays_visible: boolean;
  replay_failures_included: boolean;
  certification_blockers_visible: boolean;
  source_lineage_complete: boolean;
  analytics_ledger_immutable: boolean;
  tenant_isolated: boolean;
  authorization_valid: boolean;
  integrity_verified: boolean;
  advisory_only: boolean;
  failures: readonly ObservabilityAnalyticsFailure[];
  integrity_hash: string;
}>;

export type ObservabilityAnalyticsInput = Readonly<{
  operator_dashboard?: OperatorActivityDashboardResult;
  role?: VisibilityRole;
  analytics_window?: AnalyticsWindow;
  scenario?:
    | "BASELINE"
    | "NONDETERMINISTIC_ANALYTICS"
    | "BAD_THROUGHPUT"
    | "MISS_BOTTLENECKS"
    | "FABRICATE_TRENDS"
    | "MISSING_DATA_AS_ZERO"
    | "SUPPRESS_GOVERNANCE_DELAYS"
    | "EXCLUDE_REPLAY_FAILURES"
    | "OMIT_CERTIFICATION_BLOCKERS"
    | "INCOMPLETE_LINEAGE"
    | "MUTABLE_LEDGER"
    | "CROSS_TENANT"
    | "HASH_MISMATCH"
    | "REPLAY_RECONSTRUCTION_FAILURE"
    | "UNAUTHORIZED_ROLE"
    | "EXECUTION_AUTHORITY";
}>;

export type ObservabilityAnalyticsResult = Readonly<{
  analytics_version: "decision-observability-analytics-engine/v1";
  operator_dashboard: OperatorActivityDashboardResult;
  source_snapshot: AnalyticsSourceSnapshot;
  metric_records: readonly AnalyticsMetricRecord[];
  decision_analytics: DecisionAnalyticsRecord;
  throughput_metrics: ThroughputMetrics;
  bottlenecks: readonly BottleneckRecord[];
  trends: readonly TrendAnalysisRecord[];
  health_signals: readonly HealthSignalRecord[];
  operational_health: OperationalHealthDashboard;
  analytics_ledger: readonly AnalyticsLedgerRecord[];
  validation: ObservabilityAnalyticsValidation;
  deterministic: true;
  advisory_only: true;
  mutates_observability_or_orchestration: false;
  execution_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ObservabilityAnalyticsFoundation = Readonly<{
  analytics_version: "decision-observability-analytics-engine/v1";
  analytics_windows: readonly AnalyticsWindow[];
  bottleneck_severities: readonly BottleneckSeverity[];
  trend_directions: readonly TrendDirection[];
  health_states: readonly OperationalHealthState[];
  signal_types: readonly AnalyticsSignalType[];
  result: ObservabilityAnalyticsResult;
}>;
