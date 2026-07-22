import type { DecisionPackageCertificationGateResult } from "@/types/decision-package-certification-gate";

export type OperatorWorkflowLifecycleState = "PENDING_REVIEW" | "IN_REVIEW" | "DEFERRED" | "ESCALATED" | "APPROVED" | "REJECTED" | "ARCHIVED";
export type OperatorWorkflowAuthorityLevel = "Observer" | "Reviewer" | "Operator" | "Supervisor" | "Governance" | "Executive Authority" | "System Certification";
export type OperatorWorkflowOwnershipDomain = "Operator" | "Governance" | "Mission" | "Tenant" | "Orchestration" | "Decision Package";

export type OperatorDecisionWorkflow = Readonly<{
  workflow_id: string;
  orchestration_id: string;
  package_id: string;
  tenant_id: string;
  mission_id: string;
  operator_id: string;
  workflow_state: OperatorWorkflowLifecycleState;
  authority_level: OperatorWorkflowAuthorityLevel;
  created_at: string;
  replay_ref: string;
  lineage_ref: string;
  advisory_only: true;
  integrity_hash: string;
}>;

export type WorkflowIdentityRecord = Readonly<{
  identity_id: string;
  workflow_id: string;
  package_id: string;
  orchestration_id: string;
  tenant_id: string;
  lineage_ref: string;
  unique: boolean;
  deterministic: true;
  integrity_hash: string;
}>;

export type WorkflowLifecycleContract = Readonly<{
  lifecycle_id: string;
  workflow_id: string;
  initial_state: OperatorWorkflowLifecycleState;
  terminal_states: readonly OperatorWorkflowLifecycleState[];
  legal_states: readonly OperatorWorkflowLifecycleState[];
  legal_transitions: Readonly<Record<OperatorWorkflowLifecycleState, readonly OperatorWorkflowLifecycleState[]>>;
  completion_conditions: readonly string[];
  integrity_hash: string;
}>;

export type WorkflowOwnershipRecord = Readonly<{
  ownership_id: string;
  workflow_id: string;
  operator_id: string;
  ownership_domains: readonly OperatorWorkflowOwnershipDomain[];
  tenant_id: string;
  mission_id: string;
  immutable_owner: true;
  integrity_hash: string;
}>;

export type WorkflowAuthorityContract = Readonly<{
  authority_id: string;
  workflow_id: string;
  authority_level: OperatorWorkflowAuthorityLevel;
  permitted_authorities: readonly OperatorWorkflowAuthorityLevel[];
  authority_restrictions: readonly string[];
  governance_compliant: boolean;
  constitutional_compliant: boolean;
  integrity_hash: string;
}>;

export type WorkflowReplayRegistration = Readonly<{
  replay_registration_id: string;
  workflow_id: string;
  replay_ref: string;
  replay_complete: boolean;
  replay_deterministic: boolean;
  replay_reproducible: boolean;
  integrity_hash: string;
}>;

export type WorkflowAuditRecord = Readonly<{
  audit_id: string;
  workflow_id: string;
  recorded_events: readonly string[];
  audit_timestamp: string;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type OperatorWorkflowContractValidation = Readonly<{
  validation_id: string;
  workflow_id: string;
  identity_valid: boolean;
  lifecycle_valid: boolean;
  ownership_valid: boolean;
  authority_valid: boolean;
  replay_valid: boolean;
  integrity_valid: boolean;
  tenant_valid: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  validation_status: "VALID" | "REJECTED";
  validation_timestamp: string;
  failures: readonly OperatorWorkflowContractFailureReason[];
  integrity_hash: string;
}>;

export type OperatorWorkflowContractLedgerEntry = Readonly<{
  ledger_id: string;
  workflow_id: string;
  package_id: string;
  orchestration_id: string;
  tenant_id: string;
  mission_id: string;
  operator_id: string;
  workflow_state: OperatorWorkflowLifecycleState;
  authority_level: OperatorWorkflowAuthorityLevel;
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
  validation_status: "VALID" | "REJECTED";
  append_only: true;
  deleted: false;
  ledger_integrity_hash: string;
}>;

export type OperatorWorkflowContractFailureReason =
  | "WORKFLOW_IDENTITY_MISSING"
  | "DUPLICATE_WORKFLOW_DETECTED"
  | "OWNERSHIP_INVALID"
  | "AUTHORITY_UNDEFINED"
  | "LIFECYCLE_INVALID"
  | "REPLAY_UNAVAILABLE"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "TENANT_VALIDATION_FAILED"
  | "LINEAGE_MISSING"
  | "GOVERNANCE_VALIDATION_FAILED"
  | "CONSTITUTIONAL_VALIDATION_FAILED"
  | "CERTIFICATION_GATE_NOT_PASS"
  | "ADVISORY_ONLY_VIOLATION"
  | "UNAUTHORIZED_WORKFLOW_CONTRACT_ACCESS"
  | "REPLAY_DIVERGENCE";

export type OperatorWorkflowContractInput = Readonly<{
  certification_result?: DecisionPackageCertificationGateResult;
  workflow?: OperatorDecisionWorkflow;
  identity?: WorkflowIdentityRecord;
  lifecycle?: WorkflowLifecycleContract;
  ownership?: WorkflowOwnershipRecord;
  authority?: WorkflowAuthorityContract;
  replay_registration?: WorkflowReplayRegistration;
  audit_record?: WorkflowAuditRecord;
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type OperatorWorkflowContractResult = Readonly<{
  contract_status: "PASS" | "FAIL";
  fail_closed: boolean;
  certification_result: DecisionPackageCertificationGateResult;
  workflow: OperatorDecisionWorkflow;
  identity: WorkflowIdentityRecord;
  lifecycle: WorkflowLifecycleContract;
  ownership: WorkflowOwnershipRecord;
  authority: WorkflowAuthorityContract;
  replay_registration: WorkflowReplayRegistration;
  audit_record: WorkflowAuditRecord;
  validation: OperatorWorkflowContractValidation;
  workflow_ledger: readonly OperatorWorkflowContractLedgerEntry[];
  replay_hash: string;
  failures: readonly OperatorWorkflowContractFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type OperatorWorkflowContractReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  workflow_id: string;
  package_id: string;
  lifecycle_state: OperatorWorkflowLifecycleState;
  authority_level: OperatorWorkflowAuthorityLevel;
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly OperatorWorkflowContractFailureReason[];
  integrity_hash: string;
}>;

export type OperatorWorkflowContractObservability = Readonly<{
  workflows_created: number;
  identity_determinism: number;
  replay_reproducibility: number;
  authority_validation_accuracy: number;
  ownership_consistency: number;
  audit_completeness: number;
  integrity_verification_success: number;
  unauthorized_workflow_creation: number;
  hidden_lifecycle_transitions: number;
  fail_closed_activations: number;
}>;

export type OperatorWorkflowContractFoundation = Readonly<{
  contract_version: "operator-workflow-contract/v1";
  lifecycle_states: readonly OperatorWorkflowLifecycleState[];
  authority_levels: readonly OperatorWorkflowAuthorityLevel[];
  result: OperatorWorkflowContractResult;
  replay: OperatorWorkflowContractReplay;
  observability: OperatorWorkflowContractObservability;
}>;
