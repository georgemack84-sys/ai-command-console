import type { ReplayAnalyticsExplainabilityResult } from "@/types/decision-replay-analytics-explainability";

export type ReplayAuditCertificationArea =
  | "REPLAY_CONTRACT"
  | "SNAPSHOT_CAPTURE"
  | "TRACE_BUILDER"
  | "DETERMINISTIC_REPLAY"
  | "DIFFERENCE_DETECTOR"
  | "AUDIT_ENGINE"
  | "INTEGRITY_ENGINE"
  | "IMMUTABLE_LEDGER"
  | "ANALYTICS_EXPLAINABILITY"
  | "CROSS_SYSTEM";

export type ReplayAuditCertificationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type ReplayAuditCertificationState =
  | "NOT_STARTED"
  | "REPLAY_VALIDATION"
  | "AUDIT_VALIDATION"
  | "INTEGRITY_VALIDATION"
  | "EVIDENCE_VALIDATION"
  | "FINAL_CERTIFICATION"
  | "PASS"
  | "CONDITIONAL_PASS"
  | "FAIL";

export type ReplayAuditCertificationFailure =
  | "REPLAY_CONTRACT_INVALID"
  | "REPLAY_NONDETERMINISTIC"
  | "REPLAY_MISMATCH"
  | "SNAPSHOT_MISSING"
  | "TRACE_MISSING"
  | "AUDIT_INCOMPLETE"
  | "INTEGRITY_MISMATCH"
  | "GOVERNANCE_VIOLATION"
  | "CONSTITUTIONAL_VIOLATION"
  | "OPERATOR_INCONSISTENCY"
  | "IMMUTABLE_LEDGER_MUTATION"
  | "EVIDENCE_INCOMPLETE"
  | "REPLAY_LINEAGE_BROKEN"
  | "CERTIFICATION_EVIDENCE_INCOMPLETE"
  | "UNSUPPORTED_VERSION"
  | "TENANT_BOUNDARY_VIOLATION"
  | "UNKNOWN_CERTIFICATION_OUTCOME"
  | "FAIL_CLOSED_BEHAVIOR_NOT_ENFORCED"
  | "CERTIFICATION_TEST_FAILURE"
  | "CERTIFICATION_REPLAY_DIVERGENCE"
  | "CERTIFICATION_HASH_MISMATCH";

export type ReplayAuditConditionalGap = "DOCUMENTATION_GAP" | "VISUALIZATION_GAP" | "REPORTING_GAP" | "DASHBOARD_PRESENTATION_GAP";

export type ReplayAuditCertificationTest = Readonly<{
  test_id: string;
  certification_area: ReplayAuditCertificationArea;
  test_name: string;
  expected: "PASS" | "FAIL";
  actual: "PASS" | "FAIL";
  passed: boolean;
  severity: "CRITICAL" | "MAJOR" | "MINOR";
  evidence_ref: string;
  integrity_hash: string;
}>;

export type ReplayCertificationValidator = Readonly<{
  validator_id: string;
  replay_contract_valid: boolean;
  replay_deterministic: boolean;
  replay_outputs_identical: boolean;
  replay_reproducible: boolean;
  snapshot_complete: boolean;
  trace_complete: boolean;
  replay_lineage_complete: boolean;
  integrity_hash: string;
}>;

export type AuditCertificationValidator = Readonly<{
  validator_id: string;
  audit_complete: boolean;
  evidence_traceable: boolean;
  governance_documented: boolean;
  constitutional_documented: boolean;
  replay_documented: boolean;
  integrity_documented: boolean;
  integrity_hash: string;
}>;

export type IntegrityCertificationValidator = Readonly<{
  validator_id: string;
  integrity_verified: boolean;
  hashes_reproducible: boolean;
  ledger_consistent: boolean;
  tamper_detection_operational: boolean;
  artifact_integrity_preserved: boolean;
  tenant_isolation_valid: boolean;
  integrity_hash: string;
}>;

export type ReplayAuditCertificationEvidencePackage = Readonly<{
  package_id: string;
  certification_id: string;
  replay_refs: readonly string[];
  snapshot_refs: readonly string[];
  trace_refs: readonly string[];
  audit_refs: readonly string[];
  integrity_refs: readonly string[];
  governance_refs: readonly string[];
  constitutional_refs: readonly string[];
  operator_refs: readonly string[];
  lineage_refs: readonly string[];
  analytics_refs: readonly string[];
  integrity_hash: string;
}>;

export type ReplayAuditCertificationReport = Readonly<{
  report_id: string;
  certification_id: string;
  replay_summary: string;
  audit_summary: string;
  integrity_summary: string;
  governance_summary: string;
  constitutional_summary: string;
  operator_summary: string;
  evidence_summary: string;
  test_results: readonly string[];
  certification_outcome: ReplayAuditCertificationOutcome;
  phase_advancement_allowed: boolean;
  certification_timestamp: string;
  integrity_hash: string;
}>;

export type ReplayAuditCertificationRecord = Readonly<{
  certification_id: string;
  mission_id: string;
  orchestration_id: string;
  tenant_id: string;
  certification_version: "decision-replay-audit-certification-gate/v1";
  schema_version: "decision-replay-audit-certification-schema/v1";
  replay_validation_ref: string;
  audit_validation_ref: string;
  integrity_validation_ref: string;
  certification_tests: readonly string[];
  passed_tests: number;
  failed_tests: number;
  certification_outcome: ReplayAuditCertificationOutcome;
  evidence_package_ref: string;
  certification_report_ref: string;
  lineage_refs: readonly string[];
  conditional_gaps: readonly ReplayAuditConditionalGap[];
  integrity_hash: string;
}>;

export type ReplayAuditCertificationLedgerEntry = Readonly<{
  ledger_entry_id: string;
  certification_id: string;
  sequence: number;
  certification_record_hash: string;
  evidence_package_hash: string;
  certification_report_hash: string;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type ReplayAuditCertificationValidation = Readonly<{
  validation_id: string;
  certification_id: string;
  validation_status: "VALID" | "CONDITIONAL" | "REJECTED";
  replay_certified: boolean;
  audit_certified: boolean;
  integrity_certified: boolean;
  governance_preserved: boolean;
  constitutional_preserved: boolean;
  operator_traceable: boolean;
  evidence_complete: boolean;
  immutable_evidence_preserved: boolean;
  tenant_isolation_valid: boolean;
  fail_closed_enforced: boolean;
  phase_advancement_allowed: boolean;
  failures: readonly ReplayAuditCertificationFailure[];
  conditional_gaps: readonly ReplayAuditConditionalGap[];
  integrity_hash: string;
}>;

export type ReplayAuditCertificationInput = Readonly<{
  analytics_result?: ReplayAnalyticsExplainabilityResult;
  certification_tests?: readonly ReplayAuditCertificationTest[];
  replay_validator?: ReplayCertificationValidator;
  audit_validator?: AuditCertificationValidator;
  integrity_validator?: IntegrityCertificationValidator;
  evidence_package?: ReplayAuditCertificationEvidencePackage;
  certification_report?: ReplayAuditCertificationReport;
  certification_record?: ReplayAuditCertificationRecord;
  certification_ledger?: readonly ReplayAuditCertificationLedgerEntry[];
  conditional_gaps?: readonly ReplayAuditConditionalGap[];
  replay_expected_hash?: string;
  force_unknown_outcome?: boolean;
}>;

export type ReplayAuditCertificationResult = Readonly<{
  certification_status: ReplayAuditCertificationOutcome;
  fail_closed: boolean;
  analytics_result: ReplayAnalyticsExplainabilityResult;
  certification_tests: readonly ReplayAuditCertificationTest[];
  replay_validator: ReplayCertificationValidator;
  audit_validator: AuditCertificationValidator;
  integrity_validator: IntegrityCertificationValidator;
  evidence_package: ReplayAuditCertificationEvidencePackage;
  certification_report: ReplayAuditCertificationReport;
  certification_record: ReplayAuditCertificationRecord;
  certification_ledger: readonly ReplayAuditCertificationLedgerEntry[];
  validation: ReplayAuditCertificationValidation;
  replay_hash: string;
  failures: readonly ReplayAuditCertificationFailure[];
  conditional_gaps: readonly ReplayAuditConditionalGap[];
  deterministic: true;
  advisory_only: true;
  mutates_replay_or_audit_evidence: false;
  phase_advancement_allowed: boolean;
  integrity_hash: string;
}>;

export type ReplayAuditCertificationReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  certification_id: string;
  certification_status: ReplayAuditCertificationOutcome;
  certified_test_ids: readonly string[];
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly ReplayAuditCertificationFailure[];
  integrity_hash: string;
}>;

export type ReplayAuditCertificationObservability = Readonly<{
  certification_runs: number;
  certification_tests_executed: number;
  certification_tests_passed: number;
  certification_tests_failed: number;
  phase_advancement_approvals: number;
  conditional_passes: number;
  replay_reproducibility: number;
  fail_closed_activations: number;
}>;

export type ReplayAuditCertificationFoundation = Readonly<{
  certification_version: "decision-replay-audit-certification-gate/v1";
  certification_states: readonly ReplayAuditCertificationState[];
  result: ReplayAuditCertificationResult;
  replay: ReplayAuditCertificationReplay;
  observability: ReplayAuditCertificationObservability;
}>;
