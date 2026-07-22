import type { ArbitrationOutcome, ArbitrationRulesEngineResult } from "@/types/decision-arbitration-rules-engine";
import type { EnforcementResult } from "@/types/decision-constitutional-governance-enforcement";
import type { ConflictLedgerResult } from "@/types/decision-conflict-ledger";
import type { EscalationDestination, EscalationWorkflowResult } from "@/types/decision-conflict-escalation-workflow";
import type { TradeoffExplanationGeneratorResult } from "@/types/decision-tradeoff-explanation-generator";

export type ArbitrationDashboardName =
  | "Conflict Frequency"
  | "Conflict Categories"
  | "Resolution Rates"
  | "Escalation Rates"
  | "Operator Interventions"
  | "Governance Interventions"
  | "Simulation Requests"
  | "Certification Requests"
  | "Tradeoff Trends"
  | "Conflict Hotspots";

export type ArbitrationConflictCategory =
  | "Recommendation"
  | "Governance"
  | "Authority"
  | "Evidence"
  | "Risk"
  | "Confidence"
  | "Forecast"
  | "Mission"
  | "Recovery"
  | "Timing"
  | "Resource"
  | "Tenant"
  | "Certification"
  | "Constitutional";

export type ArbitrationTrendReportType =
  | "Conflict Summary Report"
  | "Resolution Effectiveness Report"
  | "Governance Activity Report"
  | "Constitutional Compliance Report"
  | "Escalation Report"
  | "Tradeoff Analysis Report"
  | "Operator Activity Report"
  | "Certification Activity Report"
  | "Replay Validation Report";

export type ArbitrationAnalyticsFailureReason =
  | "MISSING_OBSERVABILITY_INPUTS"
  | "UNAUTHORIZED_OBSERVABILITY_ACCESS"
  | "METRIC_SCHEMA_INVALID"
  | "REPLAY_CORRUPTION"
  | "INTEGRITY_HASH_MISMATCH"
  | "MISSING_GOVERNANCE_CONTEXT"
  | "MISSING_CONSTITUTIONAL_CONTEXT"
  | "TENANT_ISOLATION_BREACH"
  | "OBSERVATIONAL_INFLUENCE_DETECTED"
  | "ANALYTICS_LEDGER_FAILED";

export type ArbitrationMetricCollection = Readonly<{
  collection_id: string;
  source_ledger_ref: string;
  source_replay_refs: readonly string[];
  conflict_frequency: number;
  conflict_density: number;
  conflicts_by_mission: Readonly<Record<string, number>>;
  conflicts_by_tenant: Readonly<Record<string, number>>;
  conflicts_over_time: Readonly<Record<string, number>>;
  conflict_categories: Readonly<Record<ArbitrationConflictCategory, number>>;
  outcomes_by_type: Readonly<Record<ArbitrationOutcome, number>>;
  escalations_by_destination: Readonly<Record<EscalationDestination, number>>;
  escalation_reasons: Readonly<Record<string, number>>;
  governance_interventions: number;
  constitutional_reviews: number;
  operator_interventions: number;
  simulation_requests: number;
  certification_requests: number;
  tradeoff_counts: Readonly<Record<string, number>>;
  replay_validations: number;
  replay_failures: number;
  integrity_failures: number;
  unresolved_conflicts: number;
  certification_blockers: number;
  average_conflict_lifecycle_duration: number;
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
}>;

export type ArbitrationTrendPoint = Readonly<{
  trend_id: string;
  trend_category: "Conflict" | "Tradeoff" | "Escalation" | "Hotspot";
  subject: string;
  metric_value: number;
  prior_value: number;
  delta: number;
  direction: "INCREASE" | "DECREASE" | "UNCHANGED";
  evidence_refs: readonly string[];
  replay_ref: string;
  integrity_hash: string;
}>;

export type ArbitrationDashboard = Readonly<{
  dashboard_id: string;
  dashboard_name: ArbitrationDashboardName;
  metrics: Readonly<Record<string, number>>;
  evidence_refs: readonly string[];
  replay_ref: string;
  integrity_hash: string;
}>;

export type ArbitrationTrendReport = Readonly<{
  report_id: string;
  report_type: ArbitrationTrendReportType;
  reporting_period: "deterministic-ledger-window";
  metrics_summary: Readonly<Record<string, number>>;
  conflict_statistics: Readonly<Record<string, number>>;
  resolution_statistics: Readonly<Record<string, number>>;
  escalation_statistics: Readonly<Record<string, number>>;
  governance_statistics: Readonly<Record<string, number>>;
  constitutional_statistics: Readonly<Record<string, number>>;
  operator_statistics: Readonly<Record<string, number>>;
  replay_statistics: Readonly<Record<string, number>>;
  certification_statistics: Readonly<Record<string, number>>;
  replay_ref: string;
  integrity_hash: string;
}>;

export type ArbitrationAnalyticsLedgerRecord = Readonly<{
  ledger_id: string;
  collection_id: string;
  report_id: string;
  dashboard_refs: readonly string[];
  trend_refs: readonly string[];
  source_ledger_ref: string;
  advisory_only: true;
  replay_ref: string;
  lineage_ref: string;
  ledger_timestamp: string;
  integrity_hash: string;
}>;

export type ArbitrationAnalyticsValidation = Readonly<{
  validation_state: "VALID" | "REJECTED";
  fail_closed: boolean;
  failures: readonly ArbitrationAnalyticsFailureReason[];
  checks: Readonly<{
    immutable_sources_present: boolean;
    metric_schema_valid: boolean;
    governance_context_present: boolean;
    constitutional_context_present: boolean;
    tenant_isolated: boolean;
    replay_valid: boolean;
    integrity_valid: boolean;
    advisory_only: boolean;
  }>;
}>;

export type ArbitrationObservabilityAnalyticsInput = Readonly<{
  arbitration_result?: ArbitrationRulesEngineResult;
  tradeoff_result?: TradeoffExplanationGeneratorResult;
  escalation_result?: EscalationWorkflowResult;
  ledger_result?: ConflictLedgerResult;
  enforcement_result?: EnforcementResult;
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type ArbitrationObservabilityAnalyticsResult = Readonly<{
  analytics_status: "PASS" | "FAIL";
  fail_closed: boolean;
  metrics: ArbitrationMetricCollection;
  trend_points: readonly ArbitrationTrendPoint[];
  dashboards: readonly ArbitrationDashboard[];
  trend_reports: readonly ArbitrationTrendReport[];
  analytics_ledger: readonly ArbitrationAnalyticsLedgerRecord[];
  validation: ArbitrationAnalyticsValidation;
  replay_hash: string;
  failures: readonly ArbitrationAnalyticsFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type ArbitrationObservabilityReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  collection_ref: string;
  dashboard_refs: readonly string[];
  trend_report_refs: readonly string[];
  analytics_ledger_refs: readonly string[];
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly ArbitrationAnalyticsFailureReason[];
  integrity_hash: string;
}>;

export type ArbitrationObservabilityAnalyticsFoundation = Readonly<{
  analytics_version: "arbitration-observability-analytics/v1";
  dashboards: readonly ArbitrationDashboardName[];
  trend_reports: readonly ArbitrationTrendReportType[];
  result: ArbitrationObservabilityAnalyticsResult;
  replay: ArbitrationObservabilityReplay;
}>;
