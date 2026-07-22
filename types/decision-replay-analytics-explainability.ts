import type { ImmutableDecisionLedgerResult, ImmutableLedgerFailure } from "@/types/immutable-decision-ledger";

export type ReplayAnalyticsLifecycleState = "COLLECTING" | "CALCULATING" | "VALIDATING" | "PUBLISHED" | "ARCHIVED";

export type ReplayConfidenceLevel = "VERY_HIGH" | "HIGH" | "MODERATE" | "LOW" | "INSUFFICIENT";

export type ReplayExplanationType =
  | "REPLAY_MATCH"
  | "REPLAY_DIVERGENCE"
  | "REPLAY_CONFIDENCE"
  | "GOVERNANCE_REPLAY"
  | "DECISION_REPLAY"
  | "OPERATOR_REPLAY";

export type ReplayAnalyticsFailure =
  | "METRIC_REPRODUCTION_FAILURE"
  | "EXPLANATION_UNSUPPORTED_BY_EVIDENCE"
  | "REPLAY_REFERENCES_MISSING"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "INTEGRITY_REFERENCES_MISSING"
  | "DASHBOARD_INCOMPLETE"
  | "CONFIDENCE_CALCULATION_INCOMPLETE"
  | "UNSUPPORTED_METRIC_VERSION"
  | "TENANT_BOUNDARY_VIOLATION"
  | "UNKNOWN_ANALYTICS_STATE"
  | "READ_ONLY_VIOLATION"
  | "LEDGER_EVIDENCE_INCOMPLETE"
  | "LEDGER_INTEGRITY_FAILURE";

export type ReplaySuccessAnalytics = Readonly<{
  successful_replays: number;
  failed_replays: number;
  replay_match_percentage: number;
  certification_ready_percentage: number;
}>;

export type ReplayDurationAnalytics = Readonly<{
  replay_execution_ms: number;
  stage_duration_ms: number;
  validation_duration_ms: number;
  reporting_duration_ms: number;
}>;

export type ReplayDivergenceAnalytics = Readonly<{
  divergence_rate: number;
  divergence_count: number;
  divergence_categories: readonly string[];
  divergence_severity: "NONE" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  recurring_patterns: readonly string[];
}>;

export type GovernanceReplayAnalytics = Readonly<{
  governance_validation_success: boolean;
  constitutional_validation_success: boolean;
  approval_compliance: boolean;
  escalation_frequency: number;
  governance_replay_fidelity: number;
}>;

export type OperatorReplayAnalytics = Readonly<{
  approval_frequency: number;
  override_frequency: number;
  review_request_count: number;
  simulation_request_count: number;
  evidence_request_count: number;
  escalation_decision_count: number;
}>;

export type DecisionReconstructionAnalytics = Readonly<{
  reconstructed_decisions: number;
  reconstructed_contexts: number;
  reconstructed_graphs: number;
  reconstructed_packages: number;
  reconstructed_operator_workflows: number;
  reconstruction_coverage: number;
}>;

export type AuditCompletenessAnalytics = Readonly<{
  completed_audit_sections: number;
  evidence_coverage: number;
  governance_documentation: boolean;
  replay_documentation: boolean;
  certification_documentation: boolean;
}>;

export type IntegrityTrendAnalytics = Readonly<{
  integrity_verification_success: boolean;
  modified_artifacts: number;
  corrupted_artifacts: number;
  missing_artifacts: number;
  hash_verification_trend: "STABLE" | "DEGRADED";
  tamper_detection_trend: "NONE" | "DETECTED";
}>;

export type ReplayAnalyticsRecord = Readonly<{
  analytics_id: string;
  orchestration_id: string;
  replay_id: string;
  mission_id: string;
  tenant_id: string;
  analytics_version: "decision-replay-analytics-explainability/v1";
  schema_version: "decision-replay-analytics-schema/v1";
  lifecycle_state: ReplayAnalyticsLifecycleState;
  replay_success_rate: ReplaySuccessAnalytics;
  replay_duration: ReplayDurationAnalytics;
  divergence_frequency: ReplayDivergenceAnalytics;
  governance_statistics: GovernanceReplayAnalytics;
  operator_statistics: OperatorReplayAnalytics;
  reconstruction_statistics: DecisionReconstructionAnalytics;
  audit_statistics: AuditCompletenessAnalytics;
  integrity_statistics: IntegrityTrendAnalytics;
  explanation_refs: readonly string[];
  dashboard_ref: string;
  validation_status: "VALID" | "BLOCKED";
  integrity_hash: string;
}>;

export type ReplayExplanationRecord = Readonly<{
  explanation_id: string;
  replay_id: string;
  explanation_type: ReplayExplanationType;
  supporting_evidence_refs: readonly string[];
  replay_refs: readonly string[];
  governance_refs: readonly string[];
  integrity_refs: readonly string[];
  explanation_summary: string;
  confidence_level: ReplayConfidenceLevel;
  integrity_hash: string;
}>;

export type ReplayDashboardSection =
  | "REPLAY_SUMMARY"
  | "REPLAY_FIDELITY"
  | "REPLAY_DURATION"
  | "REPLAY_SUCCESS_RATE"
  | "DIVERGENCE_ANALYSIS"
  | "GOVERNANCE_STATUS"
  | "OPERATOR_ACTIVITY"
  | "RECONSTRUCTION_COVERAGE"
  | "INTEGRITY_STATUS"
  | "AUDIT_COVERAGE"
  | "CERTIFICATION_READINESS";

export type ReplayDashboardRecord = Readonly<{
  dashboard_id: string;
  replay_id: string;
  dashboard_sections: readonly ReplayDashboardSection[];
  metric_refs: readonly string[];
  explanation_refs: readonly string[];
  certification_ready: boolean;
  integrity_hash: string;
}>;

export type ReplayMetricsLedgerEntry = Readonly<{
  ledger_entry_id: string;
  analytics_id: string;
  sequence: number;
  analytics_record_hash: string;
  explanation_hashes: readonly string[];
  dashboard_hash: string;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type ReplayAnalyticsValidation = Readonly<{
  validation_id: string;
  analytics_id: string;
  validation_status: "VALID" | "BLOCKED";
  metrics_reproducible: boolean;
  explanations_complete: boolean;
  evidence_traceable: boolean;
  governance_refs_present: boolean;
  replay_refs_present: boolean;
  integrity_refs_present: boolean;
  tenant_ownership_valid: boolean;
  dashboard_complete: boolean;
  confidence_calculated: boolean;
  read_only: boolean;
  certification_ready: boolean;
  failures: readonly ReplayAnalyticsFailure[];
  inherited_ledger_failures: readonly ImmutableLedgerFailure[];
  integrity_hash: string;
}>;

export type ReplayAnalyticsExplainabilityResult = Readonly<{
  analytics_engine_version: "decision-replay-analytics-explainability/v1";
  ledger_result: ImmutableDecisionLedgerResult;
  analytics_record: ReplayAnalyticsRecord;
  explanations: readonly ReplayExplanationRecord[];
  dashboard: ReplayDashboardRecord;
  validation: ReplayAnalyticsValidation;
  metrics_ledger: readonly ReplayMetricsLedgerEntry[];
  deterministic: true;
  advisory_only: true;
  mutates_replay_evidence: false;
  certification_ready: boolean;
  integrity_hash: string;
}>;

export type ReplayAnalyticsExplainabilityFoundation = Readonly<{
  analytics_engine_version: "decision-replay-analytics-explainability/v1";
  lifecycle_states: readonly ReplayAnalyticsLifecycleState[];
  confidence_levels: readonly ReplayConfidenceLevel[];
  explanation_types: readonly ReplayExplanationType[];
  dashboard_sections: readonly ReplayDashboardSection[];
  result: ReplayAnalyticsExplainabilityResult;
}>;
