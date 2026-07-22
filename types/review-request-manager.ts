import type { OperatorActionAuthorityLevel } from "@/types/operator-action-engine";
import type { OverrideManagementResult } from "@/types/override-management";

export type ReviewRequestType = "MORE_EVIDENCE" | "SIMULATION" | "GOVERNANCE_REVIEW" | "RECOVERY_PLAN" | "CERTIFICATION_REVIEW";

export type ReviewRequestState =
  | "REQUESTED"
  | "VALIDATED"
  | "REGISTERED"
  | "DEPENDENCY_CREATED"
  | "WORKFLOW_SUSPENDED"
  | "UNDER_REVIEW"
  | "COMPLETED"
  | "DEPENDENCY_RESOLVED"
  | "WORKFLOW_RESUMED";

export type ReviewDependencyType = "EVIDENCE_DEPENDENCY" | "SIMULATION_DEPENDENCY" | "GOVERNANCE_DEPENDENCY" | "RECOVERY_DEPENDENCY" | "CERTIFICATION_DEPENDENCY";

export type ReviewRequest = Readonly<{
  review_request_id: string;
  workflow_id: string;
  tenant_id: string;
  mission_id: string;
  request_type: ReviewRequestType | string;
  requested_by: string;
  authority_level: OperatorActionAuthorityLevel | string;
  justification: string;
  request_status: ReviewRequestState;
  governance_required: boolean;
  certification_required: boolean;
  constitutional_validated: boolean;
  created_at: string;
  replay_ref: string;
  lineage_ref: string;
  advisory_only: true;
  integrity_hash: string;
}>;

export type ReviewDependency = Readonly<{
  dependency_id: string;
  workflow_id: string;
  dependency_type: ReviewDependencyType | string;
  dependent_component: string;
  dependency_status: "PENDING" | "SATISFIED" | "FAILED";
  completion_ref: string;
  replay_ref: string;
  integrity_hash: string;
}>;

export type WorkflowSuspensionRecord = Readonly<{
  suspension_id: string;
  workflow_id: string;
  preserved_state: string;
  active_approvals: readonly string[];
  operator_owner: string;
  governance_status: "VALID" | "PENDING" | "REJECTED";
  suspension_status: "SUSPENDED" | "FAILED";
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
}>;

export type ReviewCompletionRecord = Readonly<{
  completion_id: string;
  review_request_id: string;
  workflow_id: string;
  completion_status: "COMPLETED" | "INCOMPLETE" | "FAILED";
  completion_summary: string;
  completed_by: string;
  completed_at: string;
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
}>;

export type WorkflowResumptionRecord = Readonly<{
  resumption_id: string;
  workflow_id: string;
  restored_state: string;
  dependencies_resolved: boolean;
  workflow_resumed: boolean;
  resumption_summary: string;
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
}>;

export type ReviewLedgerEntry = Readonly<{
  ledger_id: string;
  workflow_id: string;
  review_request_id: string;
  dependency_id: string;
  suspension_id: string;
  completion_id: string;
  resumption_id: string;
  review_state: ReviewRequestState;
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
  append_only: true;
  deleted: false;
  ledger_integrity_hash: string;
}>;

export type ReviewRequestFailureReason =
  | "REQUEST_TYPE_UNKNOWN"
  | "REQUESTER_UNAUTHORIZED"
  | "WORKFLOW_INVALID"
  | "DEPENDENCY_CREATION_FAILED"
  | "WORKFLOW_SUSPENSION_FAILED"
  | "REQUIRED_REVIEW_INCOMPLETE"
  | "GOVERNANCE_REVIEW_INCOMPLETE"
  | "CERTIFICATION_REVIEW_INCOMPLETE"
  | "CONSTITUTIONAL_VALIDATION_FAILED"
  | "REPLAY_REFERENCE_UNAVAILABLE"
  | "LINEAGE_INCOMPLETE"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "TENANT_MISMATCH"
  | "MISSION_MISMATCH"
  | "JUSTIFICATION_MISSING"
  | "OVERRIDE_MANAGEMENT_FAILED"
  | "ADVISORY_ONLY_VIOLATION"
  | "UNAUTHORIZED_REVIEW_MANAGER_ACCESS"
  | "REPLAY_DIVERGENCE";

export type ReviewValidationResult = Readonly<{
  validation_id: string;
  workflow_id: string;
  request_type_valid: boolean;
  requester_authorized: boolean;
  workflow_valid: boolean;
  dependency_created: boolean;
  workflow_suspended: boolean;
  review_complete: boolean;
  dependency_resolved: boolean;
  workflow_resumable: boolean;
  governance_valid: boolean;
  certification_valid: boolean;
  constitutional_valid: boolean;
  tenant_valid: boolean;
  mission_valid: boolean;
  replay_valid: boolean;
  lineage_valid: boolean;
  integrity_valid: boolean;
  validation_status: "VALID" | "REJECTED";
  validation_timestamp: string;
  failures: readonly ReviewRequestFailureReason[];
  integrity_hash: string;
}>;

export type ReviewRequestManagerInput = Readonly<{
  override_result?: OverrideManagementResult;
  review_request?: ReviewRequest;
  review_dependency?: ReviewDependency;
  suspension_record?: WorkflowSuspensionRecord;
  completion_record?: ReviewCompletionRecord;
  resumption_record?: WorkflowResumptionRecord;
  review_ledger?: readonly ReviewLedgerEntry[];
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type ReviewRequestManagerResult = Readonly<{
  review_manager_status: "PASS" | "FAIL";
  fail_closed: boolean;
  override_result: OverrideManagementResult;
  review_request: ReviewRequest;
  review_dependency: ReviewDependency;
  suspension_record: WorkflowSuspensionRecord;
  completion_record: ReviewCompletionRecord;
  resumption_record: WorkflowResumptionRecord;
  validation: ReviewValidationResult;
  review_ledger: readonly ReviewLedgerEntry[];
  replay_hash: string;
  failures: readonly ReviewRequestFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type ReviewRequestReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  workflow_id: string;
  review_request_id: string;
  request_type: ReviewRequestType | string;
  dependency_id: string;
  workflow_resumed: boolean;
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly ReviewRequestFailureReason[];
  integrity_hash: string;
}>;

export type ReviewRequestObservability = Readonly<{
  review_requests_processed: number;
  dependencies_created: number;
  workflows_suspended: number;
  reviews_completed: number;
  workflows_resumed: number;
  validation_failures: number;
  replay_reproducibility: number;
  integrity_verification_success: number;
  fail_closed_activations: number;
}>;

export type ReviewRequestManagerFoundation = Readonly<{
  review_manager_version: "review-request-manager/v1";
  review_request_types: readonly ReviewRequestType[];
  review_states: readonly ReviewRequestState[];
  result: ReviewRequestManagerResult;
  replay: ReviewRequestReplay;
  observability: ReviewRequestObservability;
}>;
