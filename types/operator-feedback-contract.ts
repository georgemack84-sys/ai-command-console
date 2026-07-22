export type OperatorFeedbackType =
  | "APPROVAL"
  | "REJECTION"
  | "OVERRIDE"
  | "CLARITY"
  | "EVIDENCE"
  | "RISK"
  | "CONFIDENCE"
  | "GOVERNANCE"
  | "SIMULATION"
  | "ROLLBACK";

export type OperatorFeedbackRelevance = "NONE" | "LOW" | "MEDIUM" | "HIGH";
export type OperatorFeedbackConfidenceSignal = "OVERCONFIDENT" | "UNDERCONFIDENT" | "APPROPRIATE" | "UNKNOWN";
export type OperatorFeedbackValidationState = "ACCEPTED" | "REJECTED";

export type OperatorFeedbackFailure =
  | "DUPLICATE_IDENTIFIER"
  | "INVALID_OPERATOR"
  | "MISSING_TENANT"
  | "MISSING_MISSION"
  | "MISSING_DECISION"
  | "MISSING_REPLAY_REFERENCE"
  | "INVALID_SCHEMA_VERSION"
  | "INVALID_CONTRACT_VERSION"
  | "MALFORMED_CLASSIFICATION"
  | "CORRUPTED_INTEGRITY_HASH"
  | "UNAUTHORIZED_AUTHORITY_SCOPE"
  | "GOVERNANCE_METADATA_OMISSION"
  | "CROSS_TENANT_REFERENCE"
  | "MISSING_REQUIRED_FIELD";

export type OperatorFeedbackScenario =
  | "BASELINE"
  | "APPROVAL"
  | "REJECTION"
  | "OVERRIDE"
  | "CLARITY"
  | "EVIDENCE"
  | "RISK"
  | "CONFIDENCE"
  | "GOVERNANCE"
  | "SIMULATION"
  | "ROLLBACK"
  | "DUPLICATE_IDENTIFIER"
  | "INVALID_OPERATOR"
  | "MISSING_TENANT"
  | "MISSING_MISSION"
  | "MISSING_DECISION"
  | "MISSING_REPLAY_REFERENCE"
  | "INVALID_SCHEMA_VERSION"
  | "INVALID_CONTRACT_VERSION"
  | "MALFORMED_CLASSIFICATION"
  | "CORRUPTED_INTEGRITY_HASH"
  | "UNAUTHORIZED_AUTHORITY_SCOPE"
  | "GOVERNANCE_METADATA_OMISSION"
  | "CROSS_TENANT_REFERENCE";

export type OperatorFeedbackGovernanceMetadata = Readonly<{
  governance_context_id: string;
  policy_refs: readonly string[];
  constitutional_refs: readonly string[];
  authority_refs: readonly string[];
  tenant_scope: string;
  advisory_only: true;
  production_mutation_supported: false;
  integrity_hash: string;
}>;

export type OperatorFeedbackRecord = Readonly<{
  feedback_id: string;
  tenant_id: string;
  mission_id: string;
  operator_id: string;
  decision_id: string;
  decision_package_id: string;
  feedback_type: OperatorFeedbackType;
  feedback_summary: string;
  operator_action_taken: string;
  rationale: string;
  related_evidence_refs: readonly string[];
  related_replay_refs: readonly string[];
  adaptation_relevance: OperatorFeedbackRelevance;
  governance_relevance: OperatorFeedbackRelevance;
  confidence_signal: OperatorFeedbackConfidenceSignal;
  created_timestamp: string;
  contract_version: "operator-feedback-contract/v1";
  schema_version: "operator-feedback-schema/v1";
  record_version: "operator-feedback-record/v1";
  operator_role: string;
  authentication_method: "SESSION" | "SSO" | "SERVICE_ASSERTION";
  authority_scope: "OPERATOR_FEEDBACK_ONLY" | "GOVERNANCE_REVIEW" | "UNAUTHORIZED";
  governance_metadata: OperatorFeedbackGovernanceMetadata;
  constitutional_validation_status: "VALIDATED" | "REJECTED" | "UNKNOWN";
  replay_id: string;
  audit_id: string;
  origin_system: "mission-control";
  secondary_classifications: readonly OperatorFeedbackType[];
  original_operator_wording: string;
  normalized_classification: OperatorFeedbackType;
  immutable: true;
  append_only: true;
  replayable: true;
  integrity_hash: string;
}>;

export type OperatorFeedbackValidationReport = Readonly<{
  validation_id: string;
  validation_state: OperatorFeedbackValidationState;
  failures: readonly OperatorFeedbackFailure[];
  identity_valid: boolean;
  operator_valid: boolean;
  mission_valid: boolean;
  decision_valid: boolean;
  replay_valid: boolean;
  evidence_valid: boolean;
  governance_valid: boolean;
  integrity_valid: boolean;
  tenant_isolated: boolean;
  authority_bounded: boolean;
  accepted_as_evidence_only: boolean;
  integrity_hash: string;
}>;

export type OperatorFeedbackContractVocabulary = Readonly<{
  feedback_types: readonly OperatorFeedbackType[];
  confidence_signals: readonly OperatorFeedbackConfidenceSignal[];
  relevance_values: readonly OperatorFeedbackRelevance[];
  authority_scopes: readonly OperatorFeedbackRecord["authority_scope"][];
  integrity_hash: string;
}>;

export type OperatorFeedbackContractApiSurface = Readonly<{
  api_id: string;
  validate_feedback: "POST /operator-feedback-contract/validate";
  retrieve_contract: "GET /operator-feedback-contract/contract";
  retrieve_schema: "GET /operator-feedback-contract/schema";
  retrieve_vocabulary: "GET /operator-feedback-contract/vocabulary";
  replay_validation: "POST /operator-feedback-contract/replay";
  inspect_contract: "POST /operator-feedback-contract/inspect";
  processing_supported: false;
  normalization_supported: false;
  adaptation_generation_supported: false;
  production_mutation_supported: false;
  governance_override_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type OperatorFeedbackContractInput = Readonly<{
  scenario?: OperatorFeedbackScenario;
  record?: Partial<OperatorFeedbackRecord>;
}>;

export type OperatorFeedbackContractResult = Readonly<{
  operator_feedback_contract_version: "operator-feedback-contract/v1";
  api_surface: OperatorFeedbackContractApiSurface;
  record: OperatorFeedbackRecord;
  validation_report: OperatorFeedbackValidationReport;
  vocabulary: OperatorFeedbackContractVocabulary;
  validation_state: OperatorFeedbackValidationState;
  failures: readonly OperatorFeedbackFailure[];
  replay_hash: string;
  integrity_hash: string;
  immutable: true;
  append_only: true;
  replayable: boolean;
  deterministic: true;
  tenant_isolated: boolean;
  governance_aware: true;
  evidence_only: true;
  advisory_only: true;
}>;

export type OperatorFeedbackContractFoundation = Readonly<{
  operator_feedback_contract_version: "operator-feedback-contract/v1";
  api_surface: OperatorFeedbackContractApiSurface;
  schema_fields: readonly string[];
  vocabulary: OperatorFeedbackContractVocabulary;
  result: OperatorFeedbackContractResult;
}>;
