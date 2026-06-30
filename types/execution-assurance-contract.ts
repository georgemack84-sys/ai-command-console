export type ExecutionAssuranceType = "RUNTIME" | "GOVERNANCE" | "INTEGRITY" | "RECOVERY" | "DELEGATION" | "COMPOSITE";

export type ExecutionAssuranceScope = "TASK" | "WORKFLOW" | "EXECUTION" | "MISSION";

export type ExecutionAssuranceState =
  | "CREATED"
  | "INITIALIZING"
  | "VALIDATING"
  | "ANALYZING"
  | "ASSESSING"
  | "HEALTHY"
  | "MONITORING"
  | "WARNING"
  | "DEGRADED"
  | "RECOVERY_RECOMMENDED"
  | "ESCALATION_RECOMMENDED"
  | "ROLLBACK_RECOMMENDED"
  | "TERMINATION_RECOMMENDED"
  | "COMPLETED"
  | "FAILED";

export type ExecutionRuntimeState = "READY" | "RUNNING" | "WAITING" | "PAUSED" | "COMPLETED" | "FAILED";

export type ExecutionHealth = "HEALTHY" | "WATCH" | "DEGRADED" | "CRITICAL";

export type ExecutionAssuranceConfidenceLevel = "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT";

export type ExecutionAssuranceRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ExecutionAssuranceRecommendedAction =
  | "CONTINUE_MONITORING"
  | "INTENSIFY_MONITORING"
  | "RECOMMEND_RECOVERY"
  | "RECOMMEND_ESCALATION"
  | "RECOMMEND_ROLLBACK"
  | "RECOMMEND_TERMINATION"
  | "NO_ACTION";

export type ExecutionAssuranceValidationState = "PASS" | "FAIL";

export type ExecutionAssuranceFailureReason =
  | "REQUIRED_FIELD_MISSING"
  | "DUPLICATE_ASSURANCE_ID"
  | "IMMUTABLE_FIELD_MUTATION"
  | "TENANT_OWNERSHIP_INVALID"
  | "MISSION_OWNERSHIP_INVALID"
  | "UNSUPPORTED_SCHEMA_VERSION"
  | "INVALID_STATE_TRANSITION"
  | "GOVERNANCE_INVALID"
  | "CONSTITUTIONAL_VIOLATION"
  | "AUTHORITY_INVALID"
  | "RUNTIME_INPUT_INVALID"
  | "REPLAY_METADATA_INCOMPLETE"
  | "LINEAGE_INCOMPLETE"
  | "EVIDENCE_INCOMPLETE"
  | "INTEGRITY_HASH_MISMATCH"
  | "ASSURANCE_NOT_ADVISORY";

export type ExecutionAssuranceScenario =
  | "BASELINE"
  | "MISSING_REQUIRED_FIELD"
  | "DUPLICATE_ID"
  | "TENANT_MISMATCH"
  | "MISSION_MISMATCH"
  | "UNSUPPORTED_VERSION"
  | "INVALID_TRANSITION"
  | "GOVERNANCE_INVALID"
  | "CONSTITUTIONAL_VIOLATION"
  | "AUTHORITY_INVALID"
  | "RUNTIME_INVALID"
  | "REPLAY_MISSING"
  | "LINEAGE_BROKEN"
  | "EVIDENCE_MISSING"
  | "NOT_ADVISORY"
  | "HASH_MISMATCH";

export type ExecutionAssuranceTransition = Readonly<{
  transition_id: string;
  from_state: ExecutionAssuranceState;
  to_state: ExecutionAssuranceState;
  timestamp: string;
  evidence_reference: string;
  replay_reference: string;
  transition_hash: string;
}>;

export type RuntimeAssuranceContract = Readonly<{
  runtime_inputs: readonly string[];
  runtime_outputs: readonly string[];
  guarantees: readonly string[];
  restrictions: readonly string[];
  advisory_only: boolean;
  execution_modified: boolean;
  policy_modified: boolean;
  constitutional_rules_modified: boolean;
}>;

export type ExecutionAssuranceRecord = Readonly<{
  assurance_id: string;
  assurance_version: "execution-assurance-contract/v8E.1";
  schema_version: "execution-assurance-schema/v8E.1";
  tenant_id: string;
  mission_id: string;
  execution_id: string;
  workflow_id: string;
  assurance_type: ExecutionAssuranceType;
  assurance_scope: ExecutionAssuranceScope;
  execution_state: ExecutionRuntimeState;
  assurance_state: ExecutionAssuranceState;
  runtime_health: ExecutionHealth;
  governance_health: ExecutionHealth;
  integrity_health: ExecutionHealth;
  confidence_level: ExecutionAssuranceConfidenceLevel;
  confidence_score: number;
  risk_level: ExecutionAssuranceRiskLevel;
  risk_score: number;
  governance_score: number;
  integrity_score: number;
  recommended_action: ExecutionAssuranceRecommendedAction;
  constitutional_status: "COMPLIANT" | "VIOLATION";
  policy_status: "VALID" | "INVALID";
  authority_status: "VALID" | "INVALID";
  operator_required: boolean;
  validation_results: readonly string[];
  detected_issues: readonly string[];
  recommendations: readonly string[];
  recovery_options: readonly string[];
  checkpoint_reference: string | null;
  parent_assurance_id: string | null;
  lineage_reference: string;
  replay_reference: string;
  evidence_reference: string;
  runtime_contract: RuntimeAssuranceContract;
  lifecycle: Readonly<{
    transitions: readonly ExecutionAssuranceTransition[];
    terminal: boolean;
  }>;
  governance_metadata: Readonly<{
    constitution_version: string;
    governance_version: string;
    policy_version: string;
    authority_scope: string;
    approval_reference: string;
    operator_reference: string;
    compliance_status: "COMPLIANT" | "NON_COMPLIANT";
  }>;
  replay_metadata: Readonly<{
    replay_reference: string;
    snapshot_reference: string;
    timeline_reference: string;
    decision_reference: string;
    checkpoint_reference: string | null;
  }>;
  lineage_metadata: Readonly<{
    parent_assurance: string | null;
    child_assurances: readonly string[];
    execution_reference: string;
    workflow_reference: string;
    delegation_reference: string;
  }>;
  integrity_metadata: Readonly<{
    schema_hash: string;
    state_hash: string;
    evidence_hash: string;
    lineage_hash: string;
  }>;
  created_at: string;
  updated_at: string;
  integrity_hash: string;
}>;

export type ExecutionAssuranceValidationResult = Readonly<{
  validation_id: string;
  assurance_id: string | null;
  validation_state: ExecutionAssuranceValidationState;
  failures: readonly ExecutionAssuranceFailureReason[];
  identity_valid: boolean;
  schema_valid: boolean;
  governance_valid: boolean;
  runtime_valid: boolean;
  replay_ready: boolean;
  lineage_complete: boolean;
  integrity_verified: boolean;
  tenant_isolated: boolean;
  advisory_only: boolean;
  ready_for_runtime_assurance: boolean;
  validation_hash: string;
}>;

export type ExecutionAssuranceReplayResult = Readonly<{
  replay_id: string;
  assurance_id: string;
  reconstructed_state_order: readonly ExecutionAssuranceState[];
  reconstructed_recommended_action: ExecutionAssuranceRecommendedAction;
  reconstructed_health: ExecutionHealth;
  validation_state: ExecutionAssuranceValidationState;
  failure_reason: ExecutionAssuranceFailureReason | null;
  replay_hash: string;
}>;

export type ExecutionAssuranceObservabilitySurface = Readonly<{
  assurance_id: string;
  execution_id: string;
  workflow_id: string;
  assurance_state: ExecutionAssuranceState;
  runtime_health: ExecutionHealth;
  confidence_level: ExecutionAssuranceConfidenceLevel;
  risk_level: ExecutionAssuranceRiskLevel;
  recommended_action: ExecutionAssuranceRecommendedAction;
  validation_state: ExecutionAssuranceValidationState;
  failure_reasons: readonly ExecutionAssuranceFailureReason[];
  replay_reference: string;
  lineage_reference: string;
  integrity_status: "VALID" | "INVALID";
}>;

export type ExecutionAssuranceVersionPolicy = Readonly<{
  current_assurance_version: "execution-assurance-contract/v8E.1";
  current_schema_version: "execution-assurance-schema/v8E.1";
  supported_schema_versions: readonly string[];
  deprecated_schema_versions: readonly string[];
  semantic_version: "8.1.0";
  deterministic_compatibility_required: true;
  migration_guidance: readonly string[];
}>;

export type ExecutionAssuranceContractFramework = Readonly<{
  doctrine: Readonly<{
    principles: readonly string[];
    assurance_version: "execution-assurance-contract/v8E.1";
    lifecycle_states: readonly ExecutionAssuranceState[];
    terminal_states: readonly ExecutionAssuranceState[];
  }>;
  assurance_record: ExecutionAssuranceRecord;
  validation: ExecutionAssuranceValidationResult;
  replay: ExecutionAssuranceReplayResult;
  version_policy: ExecutionAssuranceVersionPolicy;
  observability: ExecutionAssuranceObservabilitySurface;
}>;
