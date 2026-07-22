import type { DeterministicReplayEngineResult, ReplayEqualityDomain } from "@/types/decision-deterministic-replay-engine";

export type ReplayDifferenceCategory =
  | "CANDIDATE_MISMATCH"
  | "CONTEXT_MISMATCH"
  | "PRIORITY_MISMATCH"
  | "CONFLICT_MISMATCH"
  | "GOVERNANCE_MISMATCH"
  | "PACKAGE_MISMATCH"
  | "OPERATOR_MISMATCH"
  | "OUTCOME_MISMATCH"
  | "INTEGRITY_MISMATCH";

export type ReplayDifferenceOutcome = "IDENTICAL" | "MINOR_DIFFERENCE" | "GOVERNANCE_DIFFERENCE" | "REPLAY_FAILURE" | "INTEGRITY_FAILURE";
export type ReplayDifferenceSeverity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export type ReplayDifferenceRootCause =
  | "MISSING_ARTIFACT"
  | "CORRUPTED_ARTIFACT"
  | "HASH_MISMATCH"
  | "LINEAGE_BREAK"
  | "UNSUPPORTED_VERSION"
  | "SCHEMA_CHANGE"
  | "ORDERING_CHANGE"
  | "NORMALIZATION_CHANGE"
  | "CONTEXT_CHANGE"
  | "SCORING_CHANGE"
  | "GOVERNANCE_CHANGE"
  | "OPERATOR_ACTION_CHANGE"
  | "FINAL_STATE_CHANGE"
  | "TENANT_BOUNDARY_VIOLATION"
  | "UNKNOWN_CAUSE";

export type ReplayDiffStatus = "PASS" | "BLOCKED";

export type ReplayDifferenceRecord = Readonly<{
  difference_id: string;
  replay_id: string;
  orchestration_id: string;
  mission_id: string;
  tenant_id: string;
  difference_category: ReplayDifferenceCategory;
  difference_outcome: ReplayDifferenceOutcome;
  severity: ReplayDifferenceSeverity;
  original_artifact_ref: string;
  replayed_artifact_ref: string;
  original_value_ref: string;
  replayed_value_ref: string;
  affected_domain: ReplayEqualityDomain | "integrity";
  affected_phase: string;
  affected_field: string;
  root_cause_classification: ReplayDifferenceRootCause;
  governance_impact: boolean;
  constitutional_impact: boolean;
  operator_impact: boolean;
  certification_impact: boolean;
  explanation: string;
  lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type DriftReport = Readonly<{
  drift_report_id: string;
  replay_id: string;
  orchestration_id: string;
  mission_id: string;
  tenant_id: string;
  replay_match_summary: string;
  difference_summary: string;
  affected_domains: readonly (ReplayEqualityDomain | "integrity")[];
  severity_summary: readonly ReplayDifferenceSeverity[];
  root_cause_summary: readonly ReplayDifferenceRootCause[];
  governance_summary: string;
  constitutional_summary: string;
  operator_summary: string;
  integrity_summary: string;
  certification_disposition: "CERTIFICATION_READY" | "CERTIFICATION_BLOCKED";
  explanation: string;
  integrity_hash: string;
}>;

export type DivergenceDashboardModel = Readonly<{
  dashboard_id: string;
  replay_id: string;
  replay_comparison_status: ReplayDifferenceOutcome;
  difference_categories: readonly ReplayDifferenceCategory[];
  affected_artifacts: readonly string[];
  root_cause_map: readonly string[];
  severity: ReplayDifferenceSeverity;
  governance_impact: boolean;
  integrity_status: "VERIFIED" | "FAILED";
  certification_ready: boolean;
  integrity_hash: string;
}>;

export type DiffLedgerEntry = Readonly<{
  ledger_entry_id: string;
  replay_diff_id: string;
  sequence: number;
  difference_record_ref: string;
  record_hash: string;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type ReplayDiffResult = Readonly<{
  replay_diff_id: string;
  replay_id: string;
  orchestration_id: string;
  mission_id: string;
  tenant_id: string;
  diff_status: ReplayDiffStatus;
  difference_outcome: ReplayDifferenceOutcome;
  difference_count: number;
  critical_difference_count: number;
  difference_records: readonly ReplayDifferenceRecord[];
  root_cause_summary: readonly ReplayDifferenceRootCause[];
  governance_impact_summary: boolean;
  constitutional_impact_summary: boolean;
  operator_impact_summary: boolean;
  certification_impact_summary: boolean;
  drift_report_ref: string;
  dashboard_ref: string;
  integrity_hash: string;
}>;

export type ReplayDifferenceDetectorResult = Readonly<{
  detector_version: "decision-replay-difference-detector/v1";
  replay_result: DeterministicReplayEngineResult;
  diff_result: ReplayDiffResult;
  drift_report: DriftReport;
  dashboard: DivergenceDashboardModel;
  ledger: readonly DiffLedgerEntry[];
  deterministic: true;
  advisory_only: true;
  mutates_original_records: false;
  certification_ready: boolean;
  integrity_hash: string;
}>;

export type ReplayDifferenceDetectorFoundation = Readonly<{
  detector_version: "decision-replay-difference-detector/v1";
  categories: readonly ReplayDifferenceCategory[];
  outcomes: readonly ReplayDifferenceOutcome[];
  severities: readonly ReplayDifferenceSeverity[];
  result: ReplayDifferenceDetectorResult;
}>;
