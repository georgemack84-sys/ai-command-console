import type { ReviewRequestManagerResult } from "@/types/review-request-manager";

export type EscalationType =
  | "GOVERNANCE_ESCALATION"
  | "CONSTITUTIONAL_ESCALATION"
  | "SUPERVISORY_ESCALATION"
  | "EXECUTIVE_ESCALATION"
  | "CERTIFICATION_ESCALATION";

export type EscalationAuthorityLevel =
  | "Observer"
  | "Reviewer"
  | "Operator"
  | "Supervisor"
  | "Governance Authority"
  | "Executive Authority"
  | "Certification Authority"
  | "Constitutional Authority";

export type EscalationState =
  | "REQUESTED"
  | "VALIDATED"
  | "ROUTED"
  | "WORKFLOW_SUSPENDED"
  | "UNDER_ESCALATION"
  | "RESOLVED"
  | "WORKFLOW_RESUMED";

export type EscalationRequest = Readonly<{
  escalation_request_id: string;
  workflow_id: string;
  tenant_id: string;
  mission_id: string;
  escalation_type: EscalationType | string;
  requesting_authority: EscalationAuthorityLevel | string;
  destination_authority: EscalationAuthorityLevel | string;
  escalation_reason: string;
  workflow_state: string;
  governance_validated: boolean;
  constitutional_validated: boolean;
  certification_required: boolean;
  created_at: string;
  replay_ref: string;
  lineage_ref: string;
  advisory_only: true;
  integrity_hash: string;
}>;

export type EscalationRoutingDecision = Readonly<{
  routing_id: string;
  workflow_id: string;
  escalation_type: EscalationType | string;
  routing_path: readonly string[];
  routing_outcome: "governance_queue" | "constitutional_queue" | "supervisory_queue" | "executive_queue" | "certification_queue";
  destination_authority: EscalationAuthorityLevel | string;
  routing_status: "ROUTED" | "UNROUTABLE";
  replay_ref: string;
  integrity_hash: string;
}>;

export type EscalationSuspensionRecord = Readonly<{
  suspension_id: string;
  workflow_id: string;
  preserved_workflow_state: string;
  preserved_approvals: readonly string[];
  governance_status: "VALID" | "PENDING" | "REJECTED";
  suspension_status: "SUSPENDED" | "FAILED";
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
}>;

export type EscalationRecord = Readonly<{
  escalation_id: string;
  workflow_id: string;
  escalation_type: EscalationType | string;
  routing_path: readonly string[];
  destination_authority: EscalationAuthorityLevel | string;
  escalation_status: "UNDER_ESCALATION" | "REJECTED";
  resolution_status: "RESOLVED" | "UNRESOLVED";
  replay_ref: string;
  lineage_ref: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type EscalationResolution = Readonly<{
  resolution_id: string;
  escalation_id: string;
  resolved_by: EscalationAuthorityLevel | string;
  resolution_summary: string;
  resulting_workflow_state: "WORKFLOW_RESUMED" | "WORKFLOW_HELD";
  resolved_at: string;
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
}>;

export type EscalationLedgerEntry = Readonly<{
  ledger_id: string;
  workflow_id: string;
  escalation_request_id: string;
  escalation_id: string;
  routing_id: string;
  suspension_id: string;
  resolution_id: string;
  escalation_state: EscalationState;
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
  append_only: true;
  deleted: false;
  ledger_integrity_hash: string;
}>;

export type EscalationFailureReason =
  | "ESCALATION_TYPE_UNKNOWN"
  | "REQUESTING_AUTHORITY_UNAUTHORIZED"
  | "DESTINATION_AUTHORITY_INVALID"
  | "ROUTING_UNDETERMINED"
  | "WORKFLOW_INVALID"
  | "WORKFLOW_SUSPENSION_FAILED"
  | "GOVERNANCE_ESCALATION_INCOMPLETE"
  | "CONSTITUTIONAL_ESCALATION_UNRESOLVED"
  | "CERTIFICATION_ESCALATION_UNRESOLVED"
  | "REPLAY_REFERENCE_UNAVAILABLE"
  | "LINEAGE_INCOMPLETE"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "TENANT_MISMATCH"
  | "MISSION_MISMATCH"
  | "ESCALATION_REASON_MISSING"
  | "REVIEW_MANAGER_FAILED"
  | "ADVISORY_ONLY_VIOLATION"
  | "UNAUTHORIZED_ESCALATION_WORKFLOW_ACCESS"
  | "REPLAY_DIVERGENCE";

export type EscalationValidationResult = Readonly<{
  validation_id: string;
  workflow_id: string;
  escalation_type_valid: boolean;
  requesting_authority_valid: boolean;
  destination_authority_valid: boolean;
  routing_valid: boolean;
  workflow_valid: boolean;
  workflow_suspended: boolean;
  escalation_resolved: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  certification_valid: boolean;
  tenant_valid: boolean;
  mission_valid: boolean;
  replay_valid: boolean;
  lineage_valid: boolean;
  integrity_valid: boolean;
  validation_status: "VALID" | "REJECTED";
  validation_timestamp: string;
  failures: readonly EscalationFailureReason[];
  integrity_hash: string;
}>;

export type EscalationWorkflowInput = Readonly<{
  review_result?: ReviewRequestManagerResult;
  escalation_request?: EscalationRequest;
  routing_decision?: EscalationRoutingDecision;
  suspension_record?: EscalationSuspensionRecord;
  escalation_record?: EscalationRecord;
  escalation_resolution?: EscalationResolution;
  escalation_ledger?: readonly EscalationLedgerEntry[];
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type EscalationWorkflowResult = Readonly<{
  escalation_workflow_status: "PASS" | "FAIL";
  fail_closed: boolean;
  review_result: ReviewRequestManagerResult;
  escalation_request: EscalationRequest;
  routing_decision: EscalationRoutingDecision;
  suspension_record: EscalationSuspensionRecord;
  escalation_record: EscalationRecord;
  escalation_resolution: EscalationResolution;
  validation: EscalationValidationResult;
  escalation_ledger: readonly EscalationLedgerEntry[];
  replay_hash: string;
  failures: readonly EscalationFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type EscalationWorkflowReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  workflow_id: string;
  escalation_request_id: string;
  escalation_type: EscalationType | string;
  routing_path: readonly string[];
  destination_authority: EscalationAuthorityLevel | string;
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly EscalationFailureReason[];
  integrity_hash: string;
}>;

export type EscalationWorkflowObservability = Readonly<{
  escalations_processed: number;
  escalations_routed: number;
  workflows_suspended: number;
  escalations_resolved: number;
  workflows_resumed: number;
  validation_failures: number;
  replay_reproducibility: number;
  integrity_verification_success: number;
  fail_closed_activations: number;
}>;

export type EscalationWorkflowFoundation = Readonly<{
  escalation_workflow_version: "escalation-workflow/v1";
  escalation_types: readonly EscalationType[];
  escalation_states: readonly EscalationState[];
  result: EscalationWorkflowResult;
  replay: EscalationWorkflowReplay;
  observability: EscalationWorkflowObservability;
}>;
