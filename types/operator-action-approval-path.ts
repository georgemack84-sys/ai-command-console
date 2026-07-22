import type { GovernanceAuthoritySummaryResult } from "@/types/governance-authority-summary";

export type OperatorWorkflowState = "INITIALIZED" | "GENERATING" | "VALIDATING" | "COMPLETE" | "VERIFIED" | "FAILED" | "FAIL_CLOSED";

export type OperatorActionType = "approve" | "reject" | "defer" | "escalate" | "request_simulation" | "request_evidence" | "certify";

export type OperatorActionWorkflow = Readonly<{
  workflow_id: string;
  package_id: string;
  orchestration_id: string;
  mission_id: string;
  tenant_id: string;
  available_actions: readonly OperatorActionRecord[];
  approval_path: ApprovalPathRecord;
  escalation_path: EscalationWorkflowRecord;
  certification_requirements: CertificationRequirementRecord;
  operator_summary: string;
  replay_ref: string;
  lineage_ref: string;
  advisory_only: true;
  integrity_hash: string;
}>;

export type OperatorActionRecord = Readonly<{
  action_id: string;
  package_id: string;
  action_type: OperatorActionType;
  authority_required: string;
  governance_required: boolean;
  constitutional_constraints: readonly string[];
  action_available: boolean;
  integrity_hash: string;
}>;

export type ApprovalPathRecord = Readonly<{
  approval_path_id: string;
  package_id: string;
  approval_sequence: readonly string[];
  required_approvers: readonly string[];
  governance_reviews: readonly string[];
  certification_reviews: readonly string[];
  completion_requirements: readonly string[];
  integrity_hash: string;
}>;

export type EscalationWorkflowRecord = Readonly<{
  escalation_id: string;
  package_id: string;
  escalation_conditions: readonly string[];
  escalation_targets: readonly string[];
  escalation_order: readonly string[];
  escalation_summary: string;
  integrity_hash: string;
}>;

export type CertificationRequirementRecord = Readonly<{
  certification_record_id: string;
  package_id: string;
  required_certifications: readonly string[];
  certification_order: readonly string[];
  certification_blockers: readonly string[];
  certification_summary: string;
  integrity_hash: string;
}>;

export type DecisionActionSummary = Readonly<{
  action_summary_id: string;
  package_id: string;
  available_action_types: readonly OperatorActionType[];
  required_approvals: readonly string[];
  escalation_conditions: readonly string[];
  certification_requirements: readonly string[];
  authority_limitations: readonly string[];
  integrity_hash: string;
}>;

export type OperatorWorkflowValidationResult = Readonly<{
  validation_id: string;
  package_id: string;
  operator_actions_generated: boolean;
  approval_path_complete: boolean;
  escalation_workflow_complete: boolean;
  certification_requirements_complete: boolean;
  authority_boundaries_enforced: boolean;
  governance_validation_present: boolean;
  replay_present: boolean;
  lineage_present: boolean;
  integrity_valid: boolean;
  tenant_valid: boolean;
  validation_status: "VALID" | "REJECTED";
  validation_timestamp: string;
  failures: readonly OperatorActionApprovalFailureReason[];
  integrity_hash: string;
}>;

export type OperatorWorkflowLedgerEntry = Readonly<{
  ledger_id: string;
  workflow_id: string;
  package_id: string;
  orchestration_id: string;
  generation_timestamp: string;
  operator_actions: readonly OperatorActionType[];
  approval_workflow: readonly string[];
  escalation_workflow: readonly string[];
  certification_requirements: readonly string[];
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
  validation_status: "VALID" | "REJECTED";
  append_only: true;
  deleted: false;
  ledger_integrity_hash: string;
}>;

export type OperatorActionApprovalFailureReason =
  | "OPERATOR_ACTIONS_UNAVAILABLE"
  | "APPROVAL_PATH_INCOMPLETE"
  | "ESCALATION_WORKFLOW_MISSING"
  | "CERTIFICATION_REQUIREMENTS_ABSENT"
  | "AUTHORITY_VALIDATION_MISSING"
  | "GOVERNANCE_VALIDATION_MISSING"
  | "REPLAY_REFERENCE_MISSING"
  | "LINEAGE_REFERENCE_MISSING"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "TENANT_MISMATCH"
  | "COMPLIANCE_SUMMARY_INVALID"
  | "UNAUTHORIZED_ACTION_EXPOSED"
  | "ADVISORY_ONLY_VIOLATION"
  | "UNAUTHORIZED_OPERATOR_WORKFLOW_ACCESS"
  | "REPLAY_DIVERGENCE";

export type OperatorActionApprovalInput = Readonly<{
  compliance_result?: GovernanceAuthoritySummaryResult;
  workflow?: OperatorActionWorkflow;
  action_records?: readonly OperatorActionRecord[];
  approval_path?: ApprovalPathRecord;
  escalation_workflow?: EscalationWorkflowRecord;
  certification_requirements?: CertificationRequirementRecord;
  action_summary?: DecisionActionSummary;
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type OperatorActionApprovalResult = Readonly<{
  workflow_status: "PASS" | "FAIL";
  fail_closed: boolean;
  compliance_result: GovernanceAuthoritySummaryResult;
  workflow: OperatorActionWorkflow;
  action_records: readonly OperatorActionRecord[];
  approval_path: ApprovalPathRecord;
  escalation_workflow: EscalationWorkflowRecord;
  certification_requirements: CertificationRequirementRecord;
  action_summary: DecisionActionSummary;
  validation: OperatorWorkflowValidationResult;
  workflow_ledger: readonly OperatorWorkflowLedgerEntry[];
  replay_hash: string;
  failures: readonly OperatorActionApprovalFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type OperatorActionApprovalReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  workflow_id: string;
  package_id: string;
  action_types: readonly OperatorActionType[];
  approval_sequence: readonly string[];
  certification_requirements: readonly string[];
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly OperatorActionApprovalFailureReason[];
  integrity_hash: string;
}>;

export type OperatorActionApprovalObservability = Readonly<{
  operator_workflows_generated: number;
  operator_actions_generated: number;
  approval_paths_generated: number;
  escalation_workflows_generated: number;
  certification_requirements_generated: number;
  workflow_completeness: number;
  validation_failures: number;
  replay_reproducibility: number;
  integrity_verification_success: number;
  fail_closed_activations: number;
}>;

export type OperatorActionApprovalFoundation = Readonly<{
  workflow_version: "operator-action-approval-path/v1";
  workflow_states: readonly OperatorWorkflowState[];
  supported_actions: readonly OperatorActionType[];
  result: OperatorActionApprovalResult;
  replay: OperatorActionApprovalReplay;
  observability: OperatorActionApprovalObservability;
}>;
