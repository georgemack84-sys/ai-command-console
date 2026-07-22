import type { DecisionPackageLedgerResult } from "@/types/decision-package-ledger";

export type DecisionPackageObservabilityState = "INITIALIZED" | "COLLECTING" | "ANALYZING" | "VALIDATING" | "COMPLETE" | "VERIFIED" | "FAILED" | "FAIL_CLOSED";

export type DecisionPackageObservabilityRecord = Readonly<{
  observability_id: string;
  package_id: string;
  orchestration_id: string;
  mission_id: string;
  tenant_id: string;
  completeness_score: number;
  explainability_score: number;
  evidence_coverage_score: number;
  governance_visibility_score: number;
  replay_availability: boolean;
  operator_usability_score: number;
  generation_latency: number;
  replay_ref: string;
  lineage_ref: string;
  advisory_only: true;
  integrity_hash: string;
}>;

export type ExplainabilityMetrics = Readonly<{
  metrics_id: string;
  package_id: string;
  rationale_present: boolean;
  alternatives_present: boolean;
  tradeoffs_present: boolean;
  evidence_explained: boolean;
  forecast_explained: boolean;
  governance_explained: boolean;
  authority_explained: boolean;
  explainability_score: number;
  integrity_hash: string;
}>;

export type CompletenessMetrics = Readonly<{
  completeness_id: string;
  package_id: string;
  required_sections: readonly string[];
  completed_sections: readonly string[];
  missing_sections: readonly string[];
  completeness_score: number;
  integrity_hash: string;
}>;

export type GenerationAnalyticsRecord = Readonly<{
  analytics_id: string;
  package_id: string;
  generation_duration: number;
  validation_duration: number;
  replay_registration_duration: number;
  ledger_commit_duration: number;
  total_generation_latency: number;
  integrity_hash: string;
}>;

export type OperatorVisibilityReport = Readonly<{
  report_id: string;
  package_id: string;
  visibility_summary: string;
  operator_actions_visible: boolean;
  governance_visible: boolean;
  constitutional_visible: boolean;
  replay_visible: boolean;
  approval_path_visible: boolean;
  usability_assessment: "READY" | "PARTIAL" | "BLOCKED";
  integrity_hash: string;
}>;

export type PackageDashboard = Readonly<{
  dashboard_id: string;
  package_id: string;
  executive_view: readonly string[];
  engineering_view: readonly string[];
  governance_view: readonly string[];
  operator_view: readonly string[];
  validation_status: "VALID" | "REJECTED";
  integrity_hash: string;
}>;

export type ExplainabilityScorecard = Readonly<{
  scorecard_id: string;
  package_id: string;
  recommendation_clarity: number;
  rationale_quality: number;
  evidence_traceability: number;
  alternative_transparency: number;
  tradeoff_visibility: number;
  governance_transparency: number;
  authority_transparency: number;
  action_clarity: number;
  overall_score: number;
  integrity_hash: string;
}>;

export type ObservabilityValidationResult = Readonly<{
  validation_id: string;
  package_id: string;
  completeness_metrics_generated: boolean;
  explainability_metrics_generated: boolean;
  operator_visibility_report_generated: boolean;
  replay_availability_verified: boolean;
  generation_analytics_complete: boolean;
  replay_reference_present: boolean;
  lineage_reference_present: boolean;
  integrity_verified: boolean;
  validation_status: "VALID" | "REJECTED";
  validation_timestamp: string;
  failures: readonly DecisionPackageObservabilityFailureReason[];
  integrity_hash: string;
}>;

export type ObservabilityLedgerEntry = Readonly<{
  ledger_id: string;
  observability_id: string;
  package_id: string;
  generation_timestamp: string;
  explainability_score: number;
  completeness_score: number;
  operator_usability_score: number;
  replay_availability: boolean;
  integrity_hash: string;
  validation_status: "VALID" | "REJECTED";
  append_only: true;
  deleted: false;
  ledger_integrity_hash: string;
}>;

export type DecisionPackageObservabilityFailureReason =
  | "COMPLETENESS_METRICS_MISSING"
  | "EXPLAINABILITY_METRICS_UNAVAILABLE"
  | "OPERATOR_VISIBILITY_REPORT_MISSING"
  | "REPLAY_AVAILABILITY_UNVERIFIED"
  | "ANALYTICS_INCOMPLETE"
  | "REPLAY_REFERENCE_MISSING"
  | "LINEAGE_REFERENCE_MISSING"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "LEDGER_INVALID"
  | "TENANT_MISMATCH"
  | "ADVISORY_ONLY_VIOLATION"
  | "UNAUTHORIZED_OBSERVABILITY_ACCESS"
  | "REPLAY_DIVERGENCE";

export type DecisionPackageObservabilityInput = Readonly<{
  ledger_result?: DecisionPackageLedgerResult;
  record?: DecisionPackageObservabilityRecord;
  explainability_metrics?: ExplainabilityMetrics;
  completeness_metrics?: CompletenessMetrics;
  generation_analytics?: GenerationAnalyticsRecord;
  operator_visibility_report?: OperatorVisibilityReport;
  dashboard?: PackageDashboard;
  scorecard?: ExplainabilityScorecard;
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type DecisionPackageObservabilityResult = Readonly<{
  observability_status: "PASS" | "FAIL";
  fail_closed: boolean;
  ledger_result: DecisionPackageLedgerResult;
  record: DecisionPackageObservabilityRecord;
  explainability_metrics: ExplainabilityMetrics;
  completeness_metrics: CompletenessMetrics;
  generation_analytics: GenerationAnalyticsRecord;
  operator_visibility_report: OperatorVisibilityReport;
  dashboard: PackageDashboard;
  scorecard: ExplainabilityScorecard;
  validation: ObservabilityValidationResult;
  observability_ledger: readonly ObservabilityLedgerEntry[];
  replay_hash: string;
  failures: readonly DecisionPackageObservabilityFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type DecisionPackageObservabilityReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  observability_id: string;
  package_id: string;
  completeness_score: number;
  explainability_score: number;
  operator_usability_score: number;
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly DecisionPackageObservabilityFailureReason[];
  integrity_hash: string;
}>;

export type DecisionPackageObservabilityMetrics = Readonly<{
  packages_observed: number;
  completeness_score: number;
  explainability_score: number;
  evidence_coverage_score: number;
  governance_visibility_score: number;
  replay_availability: number;
  operator_usability_score: number;
  validation_failures: number;
  integrity_verification_success: number;
  fail_closed_activations: number;
}>;

export type DecisionPackageObservabilityFoundation = Readonly<{
  observability_version: "decision-package-observability/v1";
  observability_states: readonly DecisionPackageObservabilityState[];
  result: DecisionPackageObservabilityResult;
  replay: DecisionPackageObservabilityReplay;
  observability: DecisionPackageObservabilityMetrics;
}>;
