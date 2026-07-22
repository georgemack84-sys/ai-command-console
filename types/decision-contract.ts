export type DecisionContractVersion = `${number}.${number}.${number}`;

export type DecisionType =
  | "MISSION_RECOMMENDATION"
  | "GOVERNANCE_REVIEW"
  | "RISK_RESPONSE"
  | "OPTIMIZATION_ADVISORY"
  | "CERTIFICATION_DECISION"
  | "OPERATOR_REVIEW";

export type DecisionPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type DecisionSource = "DECISION_INTAKE" | "EVIDENCE_INTELLIGENCE" | "GOVERNANCE_INTELLIGENCE" | "RISK_INTELLIGENCE" | "PREDICTION_INTELLIGENCE" | "MISSION_HEALTH_INTELLIGENCE" | "REPLAY_ENGINE" | "CERTIFICATION_FRAMEWORK";
export type DecisionValidationState = "VALID" | "INVALID" | "UNSUPPORTED_VERSION" | "TENANT_SCOPE_VIOLATION" | "INTEGRITY_MISMATCH";
export type DecisionCompatibilityState = "COMPATIBLE" | "INCOMPATIBLE";

export type DecisionGovernanceRequirements = Readonly<{
  governing_policy_refs: readonly string[];
  governance_evaluation_refs: readonly string[];
  authority_verification_refs: readonly string[];
  approval_requirement_refs: readonly string[];
  compliance_status: "COMPLIANT";
}>;

export type DecisionConstitutionalRequirements = Readonly<{
  constitutional_evaluation_refs: readonly string[];
  constitutional_evidence_refs: readonly string[];
  constitutional_lineage_refs: readonly string[];
  compliance_status: "COMPLIANT";
}>;

export type DecisionReplayRequirements = Readonly<{
  replay_id: string;
  input_snapshot_hash: string;
  governance_snapshot_hash: string;
  constitutional_snapshot_hash: string;
  expected_replay_result: "REPRODUCED";
}>;

export type DecisionLineageRequirements = Readonly<{
  lineage_id: string;
  parent_lineage_refs: readonly string[];
  evidence_lineage_refs: readonly string[];
  append_only: true;
}>;

export type DecisionValidationRules = Readonly<{
  identity_required: true;
  structure_required: true;
  governance_required: true;
  constitutional_required: true;
  replay_required: true;
  integrity_required: true;
  fail_closed: true;
}>;

export type DecisionSerializationRules = Readonly<{
  canonical_ordering: true;
  utf8_encoding: true;
  stable_property_ordering: true;
  normalized_timestamps: true;
  deterministic_numeric_precision: true;
  deterministic_null_handling: true;
}>;

export type DecisionOptionalFields = Readonly<{
  operator_id?: string;
  explanation_profile?: string;
  visualization_metadata?: Readonly<Record<string, string | number | boolean>>;
  advisory_notes?: readonly string[];
  optimization_metadata?: Readonly<Record<string, string | number | boolean>>;
  simulation_metadata?: Readonly<Record<string, string | number | boolean>>;
  confidence_annotations?: readonly string[];
  implementation_guidance?: readonly string[];
  rollback_guidance?: readonly string[];
  localization_metadata?: Readonly<Record<string, string>>;
  extensions?: Readonly<Record<string, unknown>>;
}>;

export type DecisionAuthorityBoundary = Readonly<{
  advisory_only: true;
  execution_authorized: false;
  workflow_start_authorized: false;
  deployment_authorized: false;
  policy_modification_authorized: false;
  governance_modification_authorized: false;
  constitutional_modification_authorized: false;
  authority_escalation_authorized: false;
  evidence_rewrite_authorized: false;
  automatic_learning_authorized: false;
  self_optimization_authorized: false;
}>;

export type DecisionContract = Readonly<{
  contract_version: DecisionContractVersion;
  orchestration_id: string;
  tenant_id: string;
  mission_id: string;
  decision_subject: string;
  decision_type: DecisionType;
  decision_priority: DecisionPriority;
  decision_source: DecisionSource;
  required_fields: readonly string[];
  optional_fields: DecisionOptionalFields;
  governance_requirements: DecisionGovernanceRequirements;
  constitutional_requirements: DecisionConstitutionalRequirements;
  replay_requirements: DecisionReplayRequirements;
  lineage_requirements: DecisionLineageRequirements;
  validation_rules: DecisionValidationRules;
  serialization_rules: DecisionSerializationRules;
  compatibility_version: DecisionContractVersion;
  integrity_algorithm: "SHA-256";
  authority_boundary: DecisionAuthorityBoundary;
  created_at: string;
  integrity_hash: string;
}>;

export type DecisionContractFailureReason =
  | "CONTRACT_MISSING"
  | "REQUIRED_FIELD_MISSING"
  | "UNSUPPORTED_CONTRACT_VERSION"
  | "INVALID_SEMANTIC_VERSION"
  | "UNSUPPORTED_DECISION_TYPE"
  | "UNSUPPORTED_DECISION_PRIORITY"
  | "UNSUPPORTED_DECISION_SOURCE"
  | "GOVERNANCE_REQUIREMENTS_MISSING"
  | "CONSTITUTIONAL_REQUIREMENTS_MISSING"
  | "REPLAY_REQUIREMENTS_MISSING"
  | "LINEAGE_REQUIREMENTS_MISSING"
  | "SERIALIZATION_RULES_INVALID"
  | "INTEGRITY_ALGORITHM_UNSUPPORTED"
  | "INTEGRITY_HASH_MISMATCH"
  | "TENANT_SCOPE_VIOLATION"
  | "ADVISORY_ONLY_VIOLATION"
  | "HIDDEN_BEHAVIOR_DETECTED"
  | "IMMUTABLE_TIMESTAMP_INVALID";

export type DecisionContractFailure = Readonly<{
  reason: DecisionContractFailureReason;
  field_path: string;
  message: string;
  fail_closed: true;
}>;

export type DecisionContractValidationResult = Readonly<{
  validation_state: DecisionValidationState;
  checks: Readonly<{
    contract_present: boolean;
    semantic_version_valid: boolean;
    version_supported: boolean;
    required_fields_present: boolean;
    enums_valid: boolean;
    governance_valid: boolean;
    constitutional_valid: boolean;
    replay_valid: boolean;
    lineage_valid: boolean;
    serialization_valid: boolean;
    integrity_valid: boolean;
    tenant_isolated: boolean;
    advisory_only_enforced: boolean;
    hidden_behavior_absent: boolean;
  }>;
  errors: readonly DecisionContractFailure[];
}>;

export type DecisionContractCompatibilityResult = Readonly<{
  compatibility_state: DecisionCompatibilityState;
  producer_version: DecisionContractVersion;
  consumer_version: DecisionContractVersion;
  errors: readonly DecisionContractFailure[];
}>;

export type DecisionContractObservabilityMetrics = Readonly<{
  contracts_created: number;
  validation_failures: number;
  schema_violations: number;
  compatibility_failures: number;
  version_distribution: Readonly<Record<string, number>>;
  integrity_failures: number;
  replay_validation_success: number;
  governance_validation_failures: number;
  constitutional_validation_failures: number;
}>;
