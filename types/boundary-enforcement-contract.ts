export type BoundaryEnforcementLifecycleState =
  | "CREATED"
  | "VALIDATING"
  | "AUTHORITY_VALIDATED"
  | "GOVERNANCE_VALIDATED"
  | "POLICY_VALIDATED"
  | "CONSTITUTION_VALIDATED"
  | "EXECUTION_VALIDATED"
  | "ISOLATION_VALIDATED"
  | "AUTHORIZED"
  | "RESTRICTED"
  | "BLOCKED"
  | "EXECUTED"
  | "ESCALATED"
  | "COMPLETED";

export type BoundaryValidationState = "CREATED" | "VALIDATING" | "VALID" | "INVALID" | "RESTRICTED" | "BLOCKED" | "ESCALATED" | "COMPLETED";
export type BoundaryDecisionType = "ALLOW" | "ALLOW_WITH_RESTRICTIONS" | "BLOCK" | "ESCALATE" | "FAIL_SAFE";
export type BoundaryCategory = "AUTHORITY" | "GOVERNANCE" | "CONSTITUTIONAL" | "POLICY" | "EXECUTION" | "TENANT";
export type BoundaryRequestType = "PLAN" | "ORCHESTRATE" | "DELEGATE" | "SUPERVISE" | "EXECUTE" | "ROLLBACK" | "PAUSE" | "RESUME" | "TERMINATE" | "ESCALATE";

export type BoundaryEnforcementScenario =
  | "BASELINE"
  | "ALLOW_WITH_RESTRICTIONS"
  | "OPERATOR_ESCALATION_REQUIRED"
  | "AUTHORITY_INSUFFICIENT"
  | "GOVERNANCE_REJECTION"
  | "CONSTITUTIONAL_VIOLATION"
  | "POLICY_VIOLATION"
  | "EXECUTION_LIMIT_EXCEEDED"
  | "TENANT_MISMATCH"
  | "HIDDEN_EXECUTION"
  | "REPLAY_INTEGRITY_FAILURE"
  | "INTEGRITY_VERIFICATION_FAILURE"
  | "UNKNOWN_CONDITION"
  | "MISSING_TRUTH_LEDGER"
  | "LINEAGE_MISSING"
  | "HASH_MISMATCH"
  | "SIGNATURE_MISMATCH";

export type BoundaryEnforcementFailureReason =
  | "AUTHORITY_INSUFFICIENT"
  | "GOVERNANCE_REJECTED"
  | "CONSTITUTIONAL_VIOLATION"
  | "POLICY_VIOLATION"
  | "EXECUTION_LIMIT_EXCEEDED"
  | "TENANT_MISMATCH"
  | "HIDDEN_EXECUTION_DETECTED"
  | "REPLAY_INTEGRITY_FAILURE"
  | "INTEGRITY_VERIFICATION_FAILURE"
  | "UNKNOWN_CONDITION_FAIL_CLOSED"
  | "TRUTH_LEDGER_REFERENCE_MISSING"
  | "LINEAGE_REFERENCE_MISSING"
  | "DIGITAL_SIGNATURE_INVALID";

export type BoundaryRestrictionType =
  | "EXECUTION_SCOPE_REDUCED"
  | "EXECUTION_TIME_REDUCED"
  | "RECURSION_LIMITED"
  | "RESOURCE_LIMITS_APPLIED"
  | "DELEGATION_RESTRICTED"
  | "SUPERVISION_REQUIRED"
  | "OPERATOR_APPROVAL_REQUIRED";

export type BoundaryContext = Readonly<{
  context_id: string;
  approved: boolean;
  authority_ref: string;
  evaluated_rules: readonly string[];
  evidence_refs: readonly string[];
  lineage_reference: string;
}>;

export type BoundaryExecutionConstraints = Readonly<{
  maximum_duration: number;
  maximum_depth: number;
  maximum_recursion: number;
  maximum_parallelism: number;
  allowed_resources: readonly string[];
  prohibited_resources: readonly string[];
  retry_limit: number;
  timeout: number;
  rollback_required: boolean;
}>;

export type BoundaryValidationResult = Readonly<{
  validation_id: string;
  validator: string;
  category: BoundaryCategory;
  result: BoundaryValidationState;
  confidence: number;
  evidence: readonly string[];
  evaluated_rules: readonly string[];
  detected_violations: readonly BoundaryEnforcementFailureReason[];
  explanation: string;
  timestamp: string;
  replay_reference: string;
  integrity_hash: string;
}>;

export type BoundaryDecision = Readonly<{
  decision_id: string;
  decision: BoundaryDecisionType;
  allowed: boolean;
  restrictions: readonly BoundaryRestrictionType[];
  restriction_reason: string | null;
  rejection_reason: BoundaryEnforcementFailureReason | null;
  escalation_reason: string | null;
  operator_required: boolean;
  governance_required: boolean;
  confidence: number;
  timestamp: string;
  integrity_hash: string;
}>;

export type BoundaryRuntimeMetadata = Readonly<{
  runtime_version: string;
  contract_version: "boundary-enforcement-contract/v8F.1";
  governance_version: string;
  policy_version: string;
  constitution_version: string;
  execution_environment: string;
  tenant_version: string;
}>;

export type BoundaryLineage = Readonly<{
  originating_request: string;
  parent_workflow: string;
  parent_plan: string;
  delegated_parent: string;
  supervising_authority: string;
  governance_decision: string;
  constitutional_validation: string;
  execution_lineage: string;
}>;

export type BoundaryTruthLedgerEntry = Readonly<{
  ledger_entry_id: string;
  boundary_enforcement_id: string;
  enforcement_event: string;
  validation_evidence: readonly string[];
  authority_evidence: readonly string[];
  policy_evidence: readonly string[];
  governance_evidence: readonly string[];
  constitutional_evidence: readonly string[];
  execution_constraints_hash: string;
  decision_outcome: BoundaryDecisionType;
  replay_references: readonly string[];
  append_only: true;
  recorded_at: string;
  ledger_hash: string;
}>;

export type BoundaryReplayResult = Readonly<{
  replay_id: string;
  boundary_enforcement_id: string;
  reconstructed_pipeline: readonly string[];
  reconstructed_decision: BoundaryDecisionType;
  reconstructed_validation_hashes: readonly string[];
  reconstructed_contract_hash: string;
  validation_state: "PASS" | "FAIL";
  failure_reason: BoundaryEnforcementFailureReason | null;
  replay_hash: string;
}>;

export type BoundaryEnforcementContract = Readonly<{
  boundary_enforcement_id: string;
  immutable_uuid: string;
  contract_version: "boundary-enforcement-contract/v8F.1";
  tenant_id: string;
  mission_id: string;
  execution_id: string;
  workflow_id: string;
  request_type: BoundaryRequestType;
  request_origin: string;
  boundary_category: BoundaryCategory;
  authority_context: BoundaryContext;
  governance_context: BoundaryContext;
  policy_context: BoundaryContext;
  constitutional_context: BoundaryContext;
  requested_action: string;
  requested_scope: readonly string[];
  execution_constraints: BoundaryExecutionConstraints;
  validation_results: readonly BoundaryValidationResult[];
  decision: BoundaryDecision;
  confidence: number;
  operator_required: boolean;
  restriction_reason: string | null;
  rejection_reason: BoundaryEnforcementFailureReason | null;
  escalation_reason: string | null;
  runtime_state: BoundaryEnforcementLifecycleState;
  runtime_metadata: BoundaryRuntimeMetadata;
  lineage: BoundaryLineage;
  truth_ledger_entry: BoundaryTruthLedgerEntry;
  replay: BoundaryReplayResult;
  created_at: string;
  validated_at: string;
  completed_at: string;
  lineage_reference: string;
  replay_reference: string;
  truth_ledger_reference: string;
  integrity_hash: string;
  digital_signature: string;
}>;

export type BoundaryEnforcementValidationReport = Readonly<{
  validation_id: string;
  boundary_enforcement_id: string;
  validation_state: "PASS" | "FAIL";
  failures: readonly BoundaryEnforcementFailureReason[];
  identity_immutable: boolean;
  authority_validated: boolean;
  governance_validated: boolean;
  policy_validated: boolean;
  constitution_validated: boolean;
  execution_validated: boolean;
  tenant_isolated: boolean;
  default_deny_enforced: boolean;
  replay_ready: boolean;
  lineage_complete: boolean;
  truth_ledger_recorded: boolean;
  signature_valid: boolean;
  integrity_verified: boolean;
  validation_hash: string;
}>;

export type BoundaryEnforcementObservabilitySurface = Readonly<{
  boundary_enforcement_id: string;
  lifecycle_state: BoundaryEnforcementLifecycleState;
  validation_progress: readonly BoundaryCategory[];
  evaluated_boundaries: readonly BoundaryCategory[];
  active_restrictions: readonly BoundaryRestrictionType[];
  detected_violations: readonly BoundaryEnforcementFailureReason[];
  confidence_score: number;
  operator_required: boolean;
  governance_required: boolean;
  replay_status: "PASS" | "FAIL";
  lineage_reference: string;
  execution_timeline: readonly string[];
  integrity_status: "VALID" | "INVALID";
}>;

export type BoundaryEnforcementFramework = Readonly<{
  doctrine: Readonly<{
    principles: readonly string[];
    contract_version: "boundary-enforcement-contract/v8F.1";
    lifecycle_states: readonly BoundaryEnforcementLifecycleState[];
    request_types: readonly BoundaryRequestType[];
    boundary_categories: readonly BoundaryCategory[];
    decision_types: readonly BoundaryDecisionType[];
    validation_states: readonly BoundaryValidationState[];
  }>;
  contract: BoundaryEnforcementContract;
  validation: BoundaryEnforcementValidationReport;
  replay: BoundaryReplayResult;
  observability: BoundaryEnforcementObservabilitySurface;
}>;
