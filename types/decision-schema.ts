export type DecisionSchemaVersion = "1.0.0";
export type DecisionContractVersion = "1.0.0";

export type DecisionType =
  | "PLAN_SELECTION"
  | "RECOMMENDATION_SELECTION"
  | "RISK_RESPONSE"
  | "RECOVERY_OPTION"
  | "GOVERNANCE_ESCALATION"
  | "POLICY_CONFLICT"
  | "MISSION_HEALTH_ACTION"
  | "FORECAST_RESPONSE"
  | "OPERATOR_INTERVENTION"
  | "CERTIFICATION_DECISION"
  | "CONTINUATION_DECISION"
  | "DEFERRAL_DECISION";

export type DecisionPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL" | "BLOCKING";
export type DecisionState = "CREATED" | "VALIDATING" | "EVIDENCE_READY" | "GOVERNANCE_REVIEW" | "CONSTITUTION_REVIEW" | "AUTHORITY_VALIDATION" | "READY_FOR_ORCHESTRATION" | "ORCHESTRATED" | "OPERATOR_VISIBLE" | "APPROVED" | "REJECTED" | "DEFERRED" | "ARCHIVED" | "FAILED";
export type ValidationStatus = "UNVALIDATED" | "VALID" | "INVALID" | "CONDITIONAL_VALID" | "FAILED_CLOSED";
export type DecisionReferenceType = "INPUT" | "EVIDENCE" | "RISK" | "CONFIDENCE" | "GOVERNANCE" | "CONSTITUTIONAL" | "REPLAY" | "LINEAGE" | "RECOMMENDATION" | "PLAN" | "RECOVERY" | "FORECAST" | "MISSION_HEALTH" | "CERTIFICATION" | "OPERATOR_ACTION";

export type DecisionReference = Readonly<{
  ref_id: string;
  ref_type: DecisionReferenceType;
  ref_source: string;
  tenant_id: string;
  mission_id: string;
  created_at: string;
  integrity_hash?: string;
}>;

export type DecisionMetadata = Readonly<{
  contract_version: DecisionContractVersion;
  schema_version: DecisionSchemaVersion;
  schema_name: "decision.input" | "decision.output" | "decision.metadata" | "decision.reference" | "decision.orchestration.record";
  tenant_scope: string;
  mission_scope: string;
  source_component: string;
  source_phase: "9.1.2";
  lifecycle_state: DecisionState;
  validation_status: ValidationStatus;
  created_by: string;
  created_at: string;
  updated_at?: string;
  deterministic_serialization_version: "decision-schema-canonical-json/v1";
  integrity_algorithm: "SHA-256";
  extension_namespace?: string;
}>;

export type DecisionInput = Readonly<{
  orchestration_id: string;
  tenant_id: string;
  mission_id: string;
  operator_id?: string;
  decision_subject: string;
  decision_type: DecisionType;
  decision_source: string;
  decision_priority: DecisionPriority;
  input_refs: readonly DecisionReference[];
  evidence_refs: readonly DecisionReference[];
  risk_refs?: readonly DecisionReference[];
  confidence_refs?: readonly DecisionReference[];
  governance_refs: readonly DecisionReference[];
  constitutional_refs: readonly DecisionReference[];
  replay_refs: readonly DecisionReference[];
  lineage_refs: readonly DecisionReference[];
  advisory_notes?: readonly string[];
  simulation_refs?: readonly DecisionReference[];
  forecast_refs?: readonly DecisionReference[];
  recovery_refs?: readonly DecisionReference[];
  certification_refs?: readonly DecisionReference[];
  metadata: DecisionMetadata;
  created_at: string;
  integrity_hash: string;
}>;

export type DecisionOutput = Readonly<{
  orchestration_id: string;
  tenant_id: string;
  mission_id: string;
  decision_state: DecisionState;
  selected_option_ref?: DecisionReference;
  rejected_option_refs: readonly DecisionReference[];
  deferred_option_refs: readonly DecisionReference[];
  decision_rationale_ref: DecisionReference;
  explanation_ref: DecisionReference;
  governance_result_ref: DecisionReference;
  constitutional_result_ref: DecisionReference;
  risk_result_ref?: DecisionReference;
  confidence_result_ref?: DecisionReference;
  operator_action_required: boolean;
  operator_approval_required: boolean;
  advisory_only: true;
  replay_refs: readonly DecisionReference[];
  lineage_refs: readonly DecisionReference[];
  integrity_hash: string;
  completed_at?: string;
}>;

export type DecisionOrchestrationRecord = Readonly<{
  record_id: string;
  contract_version: DecisionContractVersion;
  schema_version: DecisionSchemaVersion;
  input: DecisionInput;
  output?: DecisionOutput;
  metadata: DecisionMetadata;
  references: readonly DecisionReference[];
  integrity_hash: string;
}>;

export type DecisionSchemaFailureReason =
  | "SCHEMA_PAYLOAD_MISSING"
  | "REQUIRED_FIELD_MISSING"
  | "TYPE_MISMATCH"
  | "UNSUPPORTED_ENUM"
  | "REFERENCE_MISSING"
  | "REFERENCE_MALFORMED"
  | "REFERENCE_ORDER_NONDETERMINISTIC"
  | "REFERENCE_TYPE_MISMATCH"
  | "TENANT_SCOPE_VIOLATION"
  | "MISSION_SCOPE_VIOLATION"
  | "GOVERNANCE_REFERENCE_MISSING"
  | "CONSTITUTIONAL_REFERENCE_MISSING"
  | "REPLAY_REFERENCE_MISSING"
  | "LINEAGE_REFERENCE_MISSING"
  | "METADATA_MALFORMED"
  | "OUTPUT_OPTION_REFERENCE_MISSING"
  | "ADVISORY_ONLY_VIOLATION"
  | "TIMESTAMP_NOT_NORMALIZED"
  | "INTEGRITY_HASH_MISMATCH";

export type DecisionSchemaFailure = Readonly<{
  reason: DecisionSchemaFailureReason;
  field_path: string;
  message: string;
  fail_closed: true;
}>;

export type DecisionSchemaValidationResult = Readonly<{
  schema_name: string;
  validation_status: ValidationStatus;
  errors: readonly DecisionSchemaFailure[];
  checks: Readonly<{
    required_fields_present: boolean;
    types_valid: boolean;
    enums_valid: boolean;
    references_well_formed: boolean;
    tenant_isolated: boolean;
    mission_scoped: boolean;
    governance_present: boolean;
    constitutional_present: boolean;
    replay_present: boolean;
    lineage_present: boolean;
    deterministic_serialization_valid: boolean;
    integrity_valid: boolean;
    advisory_only_enforced: boolean;
  }>;
}>;

export type DecisionSchemaObservabilityMetrics = Readonly<{
  schema_validation_count: number;
  schema_validation_failures: number;
  failed_field_names: readonly string[];
  failed_reference_types: readonly DecisionReferenceType[];
  type_safety_failures: number;
  serialization_mismatch_count: number;
  hash_mismatch_count: number;
  unsupported_enum_count: number;
  cross_tenant_reference_rejection_count: number;
}>;
