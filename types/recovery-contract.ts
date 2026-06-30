export type RecoveryLifecycleState =
  | "CREATED"
  | "FAILURE_DETECTED"
  | "ANALYZING"
  | "RECOVERY_GENERATED"
  | "VALIDATING"
  | "RECOMMENDING"
  | "AWAITING_OPERATOR_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "READY"
  | "CLOSED";

export type RecoveryFailureCategory = "EXECUTION" | "PLANNING" | "DEPENDENCY" | "ORCHESTRATION" | "SUPERVISION" | "INTEGRITY";
export type RecoveryFailureType =
  | "execution timeout"
  | "execution interruption"
  | "execution deadlock"
  | "execution sequencing failure"
  | "invalid plan"
  | "incomplete plan"
  | "dependency omission"
  | "planning conflict"
  | "missing dependency"
  | "circular dependency"
  | "dependency unavailable"
  | "dependency mismatch"
  | "scheduling conflict"
  | "workflow interruption"
  | "coordination failure"
  | "checkpoint failure"
  | "monitoring interruption"
  | "supervision drift"
  | "policy detection failure"
  | "visibility degradation"
  | "hash mismatch"
  | "replay mismatch"
  | "lineage corruption"
  | "audit inconsistency";

export type RecoveryCategory = "CONTINUE" | "CHECKPOINT_RESTORE" | "RETRY" | "RESTART" | "ROLLBACK" | "ALTERNATIVE_PATH" | "PARTIAL_RECOVERY" | "ESCALATE" | "TERMINATE" | "MANUAL_INTERVENTION";
export type RecoveryApprovalState = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "EXPIRED";
export type RecoveryValidationStatus = "VALID" | "INVALID" | "MISSING";
export type RecoveryGovernanceStatus = "COMPLIANT" | "NON_COMPLIANT" | "BLOCKED";
export type RecoveryComplianceStatus = "COMPLIANT" | "VIOLATION" | "UNVERIFIED";
export type RecoveryIntegrityStatus = "VERIFIED" | "FAILED" | "UNVERIFIED";
export type RecoveryRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RecoveryContractFailure =
  | "IDENTITY_MISSING"
  | "LIFECYCLE_TRANSITION_INVALID"
  | "FAILURE_CLASSIFICATION_INVALID"
  | "RECOVERY_CLASSIFICATION_INVALID"
  | "RECOMMENDATION_SCHEMA_INVALID"
  | "AUTHORITY_INVALID"
  | "GOVERNANCE_INVALID"
  | "CONSTITUTIONAL_INVALID"
  | "OPERATOR_APPROVAL_MISSING"
  | "REPLAY_INVALID"
  | "LINEAGE_INVALID"
  | "INTEGRITY_INVALID"
  | "TENANT_ISOLATION_INVALID"
  | "AUTONOMOUS_EXECUTION_DETECTED"
  | "POLICY_MUTATION_DETECTED"
  | "AUTHORITY_ESCALATION_DETECTED"
  | "HIDDEN_RECOVERY_LOGIC_DETECTED";

export type RecoveryContractScenario =
  | "BASELINE"
  | "MISSING_IDENTITY"
  | "INVALID_TRANSITION"
  | "INVALID_FAILURE_CLASSIFICATION"
  | "INVALID_RECOVERY_CLASSIFICATION"
  | "INCOMPLETE_RECOMMENDATION"
  | "AUTHORITY_INVALID"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_VIOLATION"
  | "APPROVAL_MISSING"
  | "REPLAY_MISMATCH"
  | "LINEAGE_BROKEN"
  | "INTEGRITY_MISSING"
  | "TENANT_ISOLATION_FAILURE"
  | "AUTONOMOUS_EXECUTION_ATTEMPT"
  | "POLICY_MUTATION_ATTEMPT"
  | "AUTHORITY_ESCALATION_ATTEMPT"
  | "HIDDEN_RECOVERY_LOGIC";

export type RecoveryIdentity = Readonly<{
  recovery_id: string;
  mission_id: string;
  execution_id: string;
  workflow_id: string;
  plan_id: string;
  tenant_id: string;
  recovery_version: "recovery-contract/v8ALT.2.1";
  recovery_type: RecoveryCategory;
  created_timestamp: string;
  integrity_hash: string;
}>;

export type RecoveryFailureClassification = Readonly<{
  classification_id: string;
  recovery_id: string;
  failure_category: RecoveryFailureCategory;
  failure_type: RecoveryFailureType;
  severity: RecoveryRiskLevel;
  root_cause: string;
  detected_timestamp: string;
  evidence_reference: string;
  classification_hash: string;
}>;

export type RecoveryAuthorityValidation = Readonly<{
  operator_authority: RecoveryValidationStatus;
  governance_authority: RecoveryValidationStatus;
  constitutional_authority: RecoveryValidationStatus;
  execution_permissions: RecoveryValidationStatus;
  tenant_ownership: RecoveryValidationStatus;
  recovery_authorization: RecoveryValidationStatus;
  mission_authorization: RecoveryValidationStatus;
  authority_reference: string;
  authority_hash: string;
}>;

export type RecoveryApprovalWorkflow = Readonly<{
  approval_state: RecoveryApprovalState;
  required: true;
  operator_id: string | null;
  reviewed_timestamp: string | null;
  approval_reference: string;
  approval_hash: string;
}>;

export type RecoveryReplayMetadata = Readonly<{
  replay_reference: string;
  replay_version: "recovery-replay/v8ALT.2.1";
  execution_snapshot: string;
  failure_snapshot: string;
  recovery_snapshot: string;
  replay_checksum: string;
  deterministic_signature: string;
  replay_timestamp: string;
  replay_hash: string;
}>;

export type RecoveryGovernanceMetadata = Readonly<{
  governance_status: RecoveryGovernanceStatus;
  governing_policy: string;
  constitutional_reference: string;
  authority_reference: string;
  policy_validation: RecoveryValidationStatus;
  compliance_status: RecoveryComplianceStatus;
  governance_decision: "ALLOW_RECOMMENDATION" | "BLOCK_RECOMMENDATION" | "ESCALATE";
  governance_timestamp: string;
  governance_hash: string;
}>;

export type RecoveryLineageMetadata = Readonly<{
  lineage_reference: string;
  parent_execution: string;
  originating_plan: string;
  originating_failure: string;
  recovery_chain: readonly string[];
  recommendation_chain: readonly string[];
  mission_reference: string;
  tenant_reference: string;
  lineage_hash: string;
}>;

export type RecoveryIntegrityMetadata = Readonly<{
  integrity_hash: string;
  previous_hash: string;
  chain_hash: string;
  verification_status: RecoveryIntegrityStatus;
  immutable_timestamp: string;
  signature_reference: string;
}>;

export type RecoveryRecommendation = Readonly<{
  recommendation_id: string;
  recovery_id: string;
  recommendation_type: RecoveryCategory;
  summary: string;
  root_cause: string;
  expected_outcome: string;
  recovery_steps: readonly string[];
  estimated_duration: string;
  confidence_score: number;
  recovery_risk: RecoveryRiskLevel;
  governance_validation: RecoveryValidationStatus;
  constitutional_validation: RecoveryValidationStatus;
  authority_validation: RecoveryValidationStatus;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  approval_status: RecoveryApprovalState;
  recommendation_hash: string;
}>;

export type RecoveryRecord = Readonly<{
  identity: RecoveryIdentity;
  lifecycle_state: RecoveryLifecycleState;
  failure_classification: RecoveryFailureClassification;
  recommendation: RecoveryRecommendation;
  authority_validation: RecoveryAuthorityValidation;
  approval_workflow: RecoveryApprovalWorkflow;
  replay_metadata: RecoveryReplayMetadata;
  governance_metadata: RecoveryGovernanceMetadata;
  lineage_metadata: RecoveryLineageMetadata;
  integrity_metadata: RecoveryIntegrityMetadata;
  advisory_only: true;
  autonomous_execution_authorized: boolean;
  rollback_authorized: boolean;
  restart_authorized: boolean;
  policy_modified: boolean;
  authority_escalated: boolean;
  hidden_recovery_logic: boolean;
  record_hash: string;
}>;

export type RecoveryContractInput = Readonly<{
  scenario?: RecoveryContractScenario;
  lifecycle_state?: RecoveryLifecycleState;
  approval_state?: RecoveryApprovalState;
  tenant_id?: string;
  mission_id?: string;
  execution_id?: string;
  workflow_id?: string;
  plan_id?: string;
  recovery_type?: RecoveryCategory;
}>;

export type RecoveryLifecycleTransitionResult = Readonly<{
  from: RecoveryLifecycleState;
  to: RecoveryLifecycleState;
  valid: boolean;
  failure: RecoveryContractFailure | null;
  transition_hash: string;
}>;

export type RecoveryContractValidationResult = Readonly<{
  recovery_id: string | null;
  valid: boolean;
  identity_valid: boolean;
  lifecycle_valid: boolean;
  failure_classification_valid: boolean;
  recovery_classification_valid: boolean;
  recommendation_valid: boolean;
  authority_valid: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  operator_approval_enforced: boolean;
  replay_valid: boolean;
  lineage_valid: boolean;
  integrity_valid: boolean;
  tenant_isolated: boolean;
  advisory_only: boolean;
  immutable_hash_valid: boolean;
  failures: readonly RecoveryContractFailure[];
  validation_hash: string;
}>;

export type RecoveryReplayResult = Readonly<{
  replay_reference: string;
  recovery_id: string;
  deterministic: boolean;
  reconstructed_state: RecoveryLifecycleState;
  reconstructed_hash: string;
  original_hash: string;
  replay_checksum: string;
  replay_result_hash: string;
}>;

export type RecoveryContractObservabilitySurface = Readonly<{
  recovery_id: string;
  lifecycle_state: RecoveryLifecycleState;
  failure_category: RecoveryFailureCategory;
  failure_type: RecoveryFailureType;
  recommendation_type: RecoveryCategory;
  approval_state: RecoveryApprovalState;
  governance_status: RecoveryGovernanceStatus;
  constitutional_status: RecoveryComplianceStatus;
  authority_valid: boolean;
  replay_valid: boolean;
  integrity_status: RecoveryIntegrityStatus;
  tenant_id: string;
  advisory_only: true;
  record_hash: string;
}>;

export type RecoveryContract = Readonly<{
  doctrine: Readonly<{
    contract_version: "recovery-contract/v8ALT.2.1";
    principles: readonly string[];
    lifecycle_states: readonly RecoveryLifecycleState[];
    failure_categories: readonly RecoveryFailureCategory[];
    failure_types: readonly RecoveryFailureType[];
    recovery_categories: readonly RecoveryCategory[];
    approval_states: readonly RecoveryApprovalState[];
    advisory_only: true;
    operator_approval_required: true;
  }>;
  lifecycle_transitions: readonly RecoveryLifecycleTransitionResult[];
  recovery: RecoveryRecord;
  validation: RecoveryContractValidationResult;
  replay: RecoveryReplayResult;
  observability: RecoveryContractObservabilitySurface;
}>;
