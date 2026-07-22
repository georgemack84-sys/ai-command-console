import type { ForecastImpactPresentationResult } from "@/types/forecast-impact-presentation";

export type GovernanceAuthoritySummaryState = "INITIALIZED" | "GENERATING" | "VALIDATING" | "COMPLETE" | "VERIFIED" | "FAILED" | "FAIL_CLOSED";

export type GovernanceAuthoritySummary = Readonly<{
  summary_id: string;
  package_id: string;
  orchestration_id: string;
  mission_id: string;
  tenant_id: string;
  governance_status: string;
  constitutional_status: string;
  authority_requirements: readonly string[];
  approval_requirements: readonly string[];
  operator_responsibilities: readonly string[];
  restrictions: readonly string[];
  blockers: readonly string[];
  replay_ref: string;
  lineage_ref: string;
  advisory_only: true;
  integrity_hash: string;
}>;

export type GovernanceStatusRecord = Readonly<{
  governance_record_id: string;
  package_id: string;
  policy_checks: readonly string[];
  governance_result: "PASS" | "CONDITIONAL_PASS" | "FAIL";
  review_required: boolean;
  governance_restrictions: readonly string[];
  integrity_hash: string;
}>;

export type ConstitutionalStatusRecord = Readonly<{
  constitutional_record_id: string;
  package_id: string;
  constitutional_checks: readonly string[];
  validation_result: "PASS" | "CONDITIONAL_PASS" | "FAIL";
  violations: readonly string[];
  fail_closed_required: boolean;
  integrity_hash: string;
}>;

export type AuthorityRequirementRecord = Readonly<{
  authority_record_id: string;
  package_id: string;
  required_authority_level: string;
  operator_required: boolean;
  governance_review_required: boolean;
  certification_required: boolean;
  authority_limitations: readonly string[];
  integrity_hash: string;
}>;

export type ApprovalRequirementRecord = Readonly<{
  approval_record_id: string;
  package_id: string;
  required_approvers: readonly string[];
  approval_sequence: readonly string[];
  escalation_required: boolean;
  approval_blockers: readonly string[];
  integrity_hash: string;
}>;

export type ComplianceStatusReport = Readonly<{
  report_id: string;
  package_id: string;
  governance_status: string;
  constitutional_status: string;
  authority_status: string;
  approval_status: string;
  restrictions: readonly string[];
  blockers: readonly string[];
  integrity_hash: string;
}>;

export type GovernanceAuthoritySummaryValidation = Readonly<{
  validation_id: string;
  package_id: string;
  governance_status_present: boolean;
  constitutional_status_present: boolean;
  authority_requirements_present: boolean;
  approval_requirements_present: boolean;
  restrictions_documented: boolean;
  blockers_documented: boolean;
  replay_present: boolean;
  lineage_present: boolean;
  integrity_valid: boolean;
  tenant_valid: boolean;
  validation_status: "VALID" | "REJECTED";
  validation_timestamp: string;
  failures: readonly GovernanceAuthoritySummaryFailureReason[];
  integrity_hash: string;
}>;

export type ComplianceSummaryLedgerEntry = Readonly<{
  ledger_id: string;
  summary_id: string;
  package_id: string;
  orchestration_id: string;
  tenant_id: string;
  governance_status: string;
  constitutional_status: string;
  authority_requirements: readonly string[];
  approval_requirements: readonly string[];
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
  validation_status: "VALID" | "REJECTED";
  append_only: true;
  deleted: false;
  ledger_integrity_hash: string;
}>;

export type GovernanceAuthoritySummaryFailureReason =
  | "GOVERNANCE_STATUS_MISSING"
  | "CONSTITUTIONAL_STATUS_MISSING"
  | "AUTHORITY_REQUIREMENTS_MISSING"
  | "APPROVAL_REQUIREMENTS_INCOMPLETE"
  | "RESTRICTIONS_OMITTED"
  | "BLOCKERS_HIDDEN"
  | "REPLAY_REFERENCE_MISSING"
  | "LINEAGE_REFERENCE_MISSING"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "TENANT_MISMATCH"
  | "FORECAST_PRESENTATION_INVALID"
  | "CERTIFICATION_INVALID"
  | "ADVISORY_ONLY_VIOLATION"
  | "UNAUTHORIZED_GOVERNANCE_AUTHORITY_SUMMARY_ACCESS"
  | "REPLAY_DIVERGENCE";

export type GovernanceAuthoritySummaryInput = Readonly<{
  forecast_result?: ForecastImpactPresentationResult;
  summary?: GovernanceAuthoritySummary;
  governance_record?: GovernanceStatusRecord;
  constitutional_record?: ConstitutionalStatusRecord;
  authority_record?: AuthorityRequirementRecord;
  approval_record?: ApprovalRequirementRecord;
  compliance_report?: ComplianceStatusReport;
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type GovernanceAuthoritySummaryResult = Readonly<{
  summary_status: "PASS" | "FAIL";
  fail_closed: boolean;
  forecast_result: ForecastImpactPresentationResult;
  summary: GovernanceAuthoritySummary;
  governance_record: GovernanceStatusRecord;
  constitutional_record: ConstitutionalStatusRecord;
  authority_record: AuthorityRequirementRecord;
  approval_record: ApprovalRequirementRecord;
  compliance_report: ComplianceStatusReport;
  validation: GovernanceAuthoritySummaryValidation;
  compliance_ledger: readonly ComplianceSummaryLedgerEntry[];
  replay_hash: string;
  failures: readonly GovernanceAuthoritySummaryFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type GovernanceAuthoritySummaryReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  summary_id: string;
  package_id: string;
  governance_status: string;
  constitutional_status: string;
  authority_requirements: readonly string[];
  approval_requirements: readonly string[];
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly GovernanceAuthoritySummaryFailureReason[];
  integrity_hash: string;
}>;

export type GovernanceAuthoritySummaryObservability = Readonly<{
  governance_summaries_generated: number;
  constitutional_summaries_generated: number;
  authority_summaries_generated: number;
  approval_paths_generated: number;
  compliance_blockers_surfaced: number;
  validation_failures: number;
  fail_closed_activations: number;
  replay_reproducibility: number;
  integrity_verification_success: number;
}>;

export type GovernanceAuthoritySummaryFoundation = Readonly<{
  summary_version: "governance-authority-summary/v1";
  summary_states: readonly GovernanceAuthoritySummaryState[];
  result: GovernanceAuthoritySummaryResult;
  replay: GovernanceAuthoritySummaryReplay;
  observability: GovernanceAuthoritySummaryObservability;
}>;
