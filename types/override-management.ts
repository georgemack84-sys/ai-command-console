import type { ApprovalManagementResult } from "@/types/approval-management-engine";
import type { OperatorActionAuthorityLevel } from "@/types/operator-action-engine";

export type OverrideState = "REQUESTED" | "VALIDATED" | "AUTHORIZED" | "RECORDED" | "GOVERNANCE_NOTIFIED" | "FINALIZED";

export type OverrideSensitivity = "STANDARD" | "POLICY_DEVIATION" | "CERTIFICATION_IMPACT" | "AUTHORITY_ESCALATION" | "HIGH_RISK" | "REGULATORY_EXPOSURE" | "CONSTITUTIONAL_IMPLICATION";

export type OverrideRequest = Readonly<{
  override_request_id: string;
  workflow_id: string;
  tenant_id: string;
  mission_id: string;
  operator_id: string;
  operator_authenticated: boolean;
  authority_level: OperatorActionAuthorityLevel | string;
  original_recommendation_ref: string;
  operator_action: "OVERRIDE_RECOMMENDATION" | string;
  override_reason: string;
  business_justification: string;
  mission_impact: string;
  supporting_evidence_refs: readonly string[];
  sensitivity: OverrideSensitivity;
  governance_authorized: boolean;
  constitutional_authorized: boolean;
  requested_at: string;
  replay_ref: string;
  lineage_ref: string;
  advisory_only: true;
  integrity_hash: string;
}>;

export type OverrideRecord = Readonly<{
  override_id: string;
  workflow_id: string;
  original_recommendation: string;
  operator_action: string;
  override_reason: string;
  justification: string;
  authority_level: OperatorActionAuthorityLevel | string;
  governance_required: boolean;
  timestamp: string;
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
}>;

export type OverrideLineageRecord = Readonly<{
  lineage_id: string;
  override_id: string;
  recommendation_ref: string;
  workflow_ref: string;
  governance_ref: string;
  replay_ref: string;
  parent_lineage: string;
  integrity_hash: string;
}>;

export type OverrideNotificationRecord = Readonly<{
  notification_id: string;
  override_id: string;
  governance_required: boolean;
  notification_type: "GOVERNANCE_REVIEW" | "CONSTITUTIONAL_REVIEW" | "CERTIFICATION_REVIEW" | "POLICY_DEVIATION" | "NO_NOTIFICATION_REQUIRED";
  notification_status: "REGISTERED" | "NOT_REQUIRED" | "BLOCKED";
  replay_ref: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type OverrideLedgerEntry = Readonly<{
  ledger_id: string;
  workflow_id: string;
  override_id: string;
  override_state: OverrideState;
  recommendation_ref: string;
  notification_id: string;
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
  append_only: true;
  deleted: false;
  ledger_integrity_hash: string;
}>;

export type OverrideManagementFailureReason =
  | "OVERRIDE_REASON_MISSING"
  | "JUSTIFICATION_MISSING"
  | "MISSION_IMPACT_MISSING"
  | "SUPPORTING_EVIDENCE_MISSING"
  | "OPERATOR_UNAUTHORIZED"
  | "WORKFLOW_INVALID"
  | "ORIGINAL_RECOMMENDATION_UNAVAILABLE"
  | "GOVERNANCE_VALIDATION_FAILED"
  | "CONSTITUTIONAL_VALIDATION_FAILED"
  | "REPLAY_REFERENCE_UNAVAILABLE"
  | "LINEAGE_INCOMPLETE"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "TENANT_MISMATCH"
  | "MISSION_MISMATCH"
  | "APPROVAL_MANAGEMENT_FAILED"
  | "ADVISORY_ONLY_VIOLATION"
  | "UNAUTHORIZED_OVERRIDE_ENGINE_ACCESS"
  | "REPLAY_DIVERGENCE";

export type OverrideValidationResult = Readonly<{
  validation_id: string;
  workflow_id: string;
  override_reason_valid: boolean;
  justification_valid: boolean;
  authority_valid: boolean;
  workflow_valid: boolean;
  original_recommendation_preserved: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  tenant_valid: boolean;
  mission_valid: boolean;
  replay_valid: boolean;
  lineage_valid: boolean;
  integrity_valid: boolean;
  validation_status: "VALID" | "REJECTED";
  validation_timestamp: string;
  failures: readonly OverrideManagementFailureReason[];
  integrity_hash: string;
}>;

export type OverrideExplanationReport = Readonly<{
  report_id: string;
  override_id: string;
  original_recommendation: string;
  operator_action: string;
  rationale_summary: string;
  authority_summary: string;
  governance_summary: string;
  recommendation_preserved: true;
  replay_ref: string;
  integrity_hash: string;
}>;

export type OverrideManagementInput = Readonly<{
  approval_result?: ApprovalManagementResult;
  override_request?: OverrideRequest;
  override_record?: OverrideRecord;
  lineage_record?: OverrideLineageRecord;
  notification_record?: OverrideNotificationRecord;
  explanation_report?: OverrideExplanationReport;
  override_ledger?: readonly OverrideLedgerEntry[];
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type OverrideManagementResult = Readonly<{
  override_management_status: "PASS" | "FAIL";
  fail_closed: boolean;
  approval_result: ApprovalManagementResult;
  override_request: OverrideRequest;
  validation: OverrideValidationResult;
  override_record: OverrideRecord;
  lineage_record: OverrideLineageRecord;
  notification_record: OverrideNotificationRecord;
  explanation_report: OverrideExplanationReport;
  override_ledger: readonly OverrideLedgerEntry[];
  replay_hash: string;
  failures: readonly OverrideManagementFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type OverrideManagementReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  workflow_id: string;
  override_id: string;
  original_recommendation: string;
  operator_action: string;
  governance_notification: string;
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly OverrideManagementFailureReason[];
  integrity_hash: string;
}>;

export type OverrideManagementObservability = Readonly<{
  overrides_processed: number;
  overrides_recorded: number;
  governance_notifications_registered: number;
  recommendation_preservation_success: number;
  lineage_records_generated: number;
  validation_failures: number;
  replay_reproducibility: number;
  integrity_verification_success: number;
  fail_closed_activations: number;
}>;

export type OverrideManagementFoundation = Readonly<{
  override_management_version: "override-management/v1";
  override_states: readonly OverrideState[];
  result: OverrideManagementResult;
  replay: OverrideManagementReplay;
  observability: OverrideManagementObservability;
}>;
