import type { OperatorActionAuthorityLevel, OperatorActionEngineResult } from "@/types/operator-action-engine";

export type ApprovalType = "GOVERNANCE_APPROVAL" | "SUPERVISORY_APPROVAL" | "OPERATOR_APPROVAL" | "CERTIFICATION_APPROVAL";

export type ApprovalState = "PENDING" | "ASSIGNED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "COMPLETED";

export type ApprovalRequest = Readonly<{
  approval_request_id: string;
  workflow_id: string;
  tenant_id: string;
  mission_id: string;
  approval_type: ApprovalType | string;
  required_authority: OperatorActionAuthorityLevel | string;
  assigned_approver: string;
  dependency_refs: readonly string[];
  approval_status: ApprovalState;
  requested_at: string;
  replay_ref: string;
  lineage_ref: string;
  advisory_only: true;
  integrity_hash: string;
}>;

export type ApprovalRecord = Readonly<{
  approval_id: string;
  workflow_id: string;
  approval_type: ApprovalType | string;
  approver_id: string;
  authority_level: OperatorActionAuthorityLevel | string;
  approval_result: "APPROVED" | "REJECTED" | "PENDING";
  approval_reason: string;
  dependency_status: "SATISFIED" | "INCOMPLETE";
  replay_ref: string;
  lineage_ref: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type ApprovalDependency = Readonly<{
  dependency_id: string;
  workflow_id: string;
  parent_approval: ApprovalType | string;
  child_approval: ApprovalType | string;
  dependency_type: "SEQUENTIAL" | "PARALLEL" | "HYBRID";
  dependency_status: "SATISFIED" | "INCOMPLETE";
  replay_ref: string;
  integrity_hash: string;
}>;

export type ApprovalLedgerEntry = Readonly<{
  ledger_id: string;
  workflow_id: string;
  approval_type: ApprovalType | string;
  approval_request_id: string;
  approval_id: string;
  approval_status: ApprovalState;
  approval_result: "APPROVED" | "REJECTED" | "PENDING";
  dependency_status: "SATISFIED" | "INCOMPLETE";
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
  append_only: true;
  deleted: false;
  ledger_integrity_hash: string;
}>;

export type ApprovalManagementFailureReason =
  | "REQUIRED_APPROVAL_MISSING"
  | "APPROVER_UNAUTHORIZED"
  | "APPROVAL_DEPENDENCY_INCOMPLETE"
  | "WORKFLOW_STATE_INVALID"
  | "GOVERNANCE_APPROVAL_MISSING"
  | "CONSTITUTIONAL_APPROVAL_FAILED"
  | "CERTIFICATION_APPROVAL_MISSING"
  | "REPLAY_REFERENCE_UNAVAILABLE"
  | "LINEAGE_REFERENCE_MISSING"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "TENANT_MISMATCH"
  | "MISSION_MISMATCH"
  | "DUPLICATE_APPROVAL_DETECTED"
  | "APPROVAL_TYPE_INVALID"
  | "ACTION_ENGINE_FAILED"
  | "ADVISORY_ONLY_VIOLATION"
  | "UNAUTHORIZED_APPROVAL_ENGINE_ACCESS"
  | "REPLAY_DIVERGENCE";

export type ApprovalCompletion = Readonly<{
  completion_id: string;
  workflow_id: string;
  required_approvals: readonly ApprovalType[];
  completed_approvals: readonly ApprovalType[];
  workflow_progression_authorized: boolean;
  completion_status: "COMPLETE" | "BLOCKED";
  completion_summary: string;
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
}>;

export type ApprovalManagementValidationResult = Readonly<{
  validation_id: string;
  workflow_id: string;
  required_approvals_present: boolean;
  approvers_authorized: boolean;
  dependencies_satisfied: boolean;
  workflow_eligible: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  certification_valid: boolean;
  tenant_valid: boolean;
  mission_valid: boolean;
  replay_valid: boolean;
  lineage_valid: boolean;
  integrity_valid: boolean;
  approval_completion_valid: boolean;
  validation_status: "VALID" | "REJECTED";
  validation_timestamp: string;
  failures: readonly ApprovalManagementFailureReason[];
  integrity_hash: string;
}>;

export type ApprovalManagementInput = Readonly<{
  action_result?: OperatorActionEngineResult;
  approval_requests?: readonly ApprovalRequest[];
  approval_dependencies?: readonly ApprovalDependency[];
  approval_records?: readonly ApprovalRecord[];
  approval_ledger?: readonly ApprovalLedgerEntry[];
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type ApprovalManagementResult = Readonly<{
  approval_management_status: "PASS" | "FAIL";
  fail_closed: boolean;
  action_result: OperatorActionEngineResult;
  approval_requests: readonly ApprovalRequest[];
  approval_dependencies: readonly ApprovalDependency[];
  approval_records: readonly ApprovalRecord[];
  validation: ApprovalManagementValidationResult;
  completion: ApprovalCompletion;
  approval_ledger: readonly ApprovalLedgerEntry[];
  replay_hash: string;
  failures: readonly ApprovalManagementFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type ApprovalManagementReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  workflow_id: string;
  approval_sequence: readonly ApprovalType[];
  completed_approvals: readonly ApprovalType[];
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly ApprovalManagementFailureReason[];
  integrity_hash: string;
}>;

export type ApprovalManagementObservability = Readonly<{
  approval_workflows_generated: number;
  required_approvals_discovered: number;
  approvals_completed: number;
  dependency_edges_validated: number;
  workflow_progression_authorizations: number;
  validation_failures: number;
  replay_reproducibility: number;
  integrity_verification_success: number;
  fail_closed_activations: number;
}>;

export type ApprovalManagementFoundation = Readonly<{
  approval_management_version: "approval-management-engine/v1";
  approval_types: readonly ApprovalType[];
  approval_states: readonly ApprovalState[];
  result: ApprovalManagementResult;
  replay: ApprovalManagementReplay;
  observability: ApprovalManagementObservability;
}>;
