export type ExplanationType = "PLANNING" | "EXECUTION" | "DELEGATION" | "ORCHESTRATION" | "SUPERVISION" | "GOVERNANCE" | "INTERVENTION" | "REPLAY";
export type ExplanationLifecycleState = "CREATED" | "VALIDATED" | "ENRICHED" | "GOVERNANCE_VERIFIED" | "CONSTITUTION_VERIFIED" | "REGISTERED" | "CERTIFIED" | "REPLAYABLE" | "ARCHIVED" | "REJECTED";
export type ExplanationStatus = "ACTIVE" | "REJECTED" | "ARCHIVED";
export type ReasoningSource = "EVIDENCE" | "POLICY" | "CONSTITUTION" | "AUTHORITY" | "REPLAY" | "OPERATOR";

export type ExplainabilityScenario =
  | "BASELINE"
  | "DUPLICATE_EXPLANATION_ID"
  | "MISSING_IDENTIFIERS"
  | "INCOMPLETE_DECISION_SUMMARY"
  | "MISSING_SELECTED_OPTION"
  | "UNDOCUMENTED_REJECTED_OPTIONS"
  | "MISSING_EVIDENCE"
  | "INCOMPLETE_POLICY_REFERENCES"
  | "MISSING_CONSTITUTIONAL_REFERENCES"
  | "AUTHORITY_VALIDATION_FAILURE"
  | "MISSING_CONFIDENCE_REASONING"
  | "MISSING_RISK_REASONING"
  | "INVALID_REPLAY_REFERENCE"
  | "INTEGRITY_HASH_FAILURE"
  | "ORDERING_VIOLATION"
  | "CROSS_TENANT_REFERENCE"
  | "FABRICATED_REASONING"
  | "ADVISORY_ONLY_VIOLATION";

export type ExplainabilityFailure =
  | "EXPLANATION_ID_DUPLICATED"
  | "REQUIRED_IDENTIFIERS_MISSING"
  | "DECISION_SUMMARY_INCOMPLETE"
  | "SELECTED_OPTION_ABSENT"
  | "REJECTED_OPTIONS_UNDOCUMENTED"
  | "EVIDENCE_REFERENCES_MISSING"
  | "POLICY_REFERENCES_INCOMPLETE"
  | "CONSTITUTIONAL_REFERENCES_ABSENT"
  | "AUTHORITY_VALIDATION_FAILED"
  | "CONFIDENCE_REASONING_MISSING"
  | "RISK_REASONING_MISSING"
  | "REPLAY_REFERENCE_INVALID"
  | "INTEGRITY_HASH_INVALID"
  | "DETERMINISTIC_ORDERING_VIOLATED"
  | "CROSS_TENANT_REFERENCE_DETECTED"
  | "FABRICATED_REASONING_DETECTED"
  | "ADVISORY_ONLY_VIOLATION";

export type DecisionSummary = Readonly<{
  decision_type: string;
  decision_state: string;
  objective: string;
  decision_timestamp: string;
  decision_result: string;
}>;

export type SelectedOption = Readonly<{
  option: string;
  approval_status: string;
  selection_reason: string;
}>;

export type RejectedOption = Readonly<{
  option: string;
  reason_for_rejection: string;
  governance_reason: string;
  policy_reason: string;
  constitutional_reason: string;
  risk_reason: string;
  confidence_difference: number;
}>;

export type AuthorityReferences = Readonly<{
  required_authority: string;
  validated_authority: string;
  approval_source: string;
  authority_chain: readonly string[];
  authority_result: string;
}>;

export type ConfidenceReasoning = Readonly<{
  confidence_score: number;
  contributing_factors: readonly string[];
  evidence_quality: number;
  historical_consistency: number;
  replay_consistency: number;
  governance_certainty: number;
}>;

export type RiskReasoning = Readonly<{
  operational_risk: number;
  governance_risk: number;
  execution_risk: number;
  policy_risk: number;
  constitutional_risk: number;
  integrity_risk: number;
  mitigation_rationale: string;
}>;

export type ReplayMetadata = Readonly<{
  replay_reference: string;
  truth_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  reconstruction_version: string;
}>;

export type ExplanationRecord = Readonly<{
  explanation_id: string;
  explanation_version: "explanation/v8ALT.5.1";
  contract_version: "explainability-contract/v8ALT.5.1";
  tenant_id: string;
  mission_id: string;
  execution_id: string;
  plan_id: string;
  decision_id: string;
  timestamp: string;
  created_by: string;
  engine_version: string;
  status: ExplanationStatus;
  explanation_type: ExplanationType;
  lifecycle_state: ExplanationLifecycleState;
  decision_summary: DecisionSummary;
  selected_option: SelectedOption | null;
  rejected_options: readonly RejectedOption[];
  evidence_references: readonly string[];
  policy_references: readonly string[];
  constitutional_references: readonly string[];
  authority_references: AuthorityReferences;
  confidence_reasoning: ConfidenceReasoning | null;
  risk_reasoning: RiskReasoning | null;
  replay: ReplayMetadata;
  reasoning_source: ReasoningSource;
  evidence_bound: boolean;
  inference_declared: boolean;
  unsupported_claims: readonly string[];
  fabricated_reasoning_detected: boolean;
  deterministic_order: number;
  advisory_only: true;
  plan_modified: boolean;
  execution_modified: boolean;
  evidence_modified: boolean;
  governance_modified: boolean;
  authority_escalated: boolean;
  policy_changed: boolean;
  mission_state_modified: boolean;
  explanation_hash: string;
}>;

export type ExplanationRepository = Readonly<{
  repository_id: string;
  tenant_id: string;
  mission_id: string;
  explanations: readonly ExplanationRecord[];
  append_only: true;
  read_only: true;
  repository_hash: string;
}>;

export type ExplainabilityInput = Readonly<{
  scenario?: ExplainabilityScenario;
  tenant_id?: string;
  mission_id?: string;
  explanation?: ExplanationRecord;
}>;

export type ExplainabilitySearchCriteria = Readonly<{
  mission_id?: string;
  execution_id?: string;
  decision_id?: string;
  plan_id?: string;
  tenant_id?: string;
  authority?: string;
  policy?: string;
  confidence_min?: number;
  risk_max?: number;
  replay_reference?: string;
}>;

export type ExplainabilityValidationResult = Readonly<{
  explanation_id: string | null;
  valid: boolean;
  identity_valid: boolean;
  schema_valid: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  authority_valid: boolean;
  replay_valid: boolean;
  integrity_valid: boolean;
  deterministic_ordering_valid: boolean;
  tenant_isolated: boolean;
  fabricated_reasoning_rejected: boolean;
  advisory_only_enforced: boolean;
  failures: readonly ExplainabilityFailure[];
  validation_hash: string;
}>;

export type ExplainabilityReplayResult = Readonly<{
  replay_reference: string;
  explanation_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_result_hash: string;
}>;

export type ExplainabilityObservabilitySurface = Readonly<{
  repository_id: string;
  tenant_id: string;
  mission_id: string;
  explanation_count: number;
  explanation_types: readonly ExplanationType[];
  advisory_only: true;
  repository_hash: string;
}>;

export type ExplainabilityContract = Readonly<{
  doctrine: Readonly<{
    contract_version: "explainability-contract/v8ALT.5.1";
    principles: readonly string[];
    explanation_types: readonly ExplanationType[];
    lifecycle_states: readonly ExplanationLifecycleState[];
    reasoning_sources: readonly ReasoningSource[];
    advisory_only: true;
  }>;
  repository: ExplanationRepository;
  validation: ExplainabilityValidationResult;
  replay: ExplainabilityReplayResult;
  observability: ExplainabilityObservabilitySurface;
}>;
