export type GovernanceLineageType = "POLICY" | "CONSTITUTION" | "AUTHORITY" | "EVIDENCE" | "RISK" | "COMPLIANCE" | "RECOMMENDATION" | "ESCALATION" | "DECISION" | "GOVERNANCE";

export type GovernanceLineageObjectType = "Recommendation" | "ComplianceFinding" | "RiskAssessment" | "EscalationDecision" | "GovernanceDecision" | "PolicyEvaluation";

export type GovernanceLineageRelationshipType = "SUPPORTED_BY" | "INFLUENCED_BY" | "REQUIRED_BY" | "OVERRIDDEN_BY" | "CONSTRAINED_BY" | "ESCALATED_BY" | "VALIDATED_BY" | "SUPERSEDED_BY" | "CORRELATED_WITH";

export type GovernanceLineageState = "CREATED" | "VALIDATED" | "CERTIFIED" | "SUPERSEDED" | "ARCHIVED";

export type GovernanceLineageReplayState = "REPRODUCED" | "MISMATCH" | "INCOMPLETE";

export type GovernanceLineageValidationState = "VALID" | "INVALID" | "TENANT_SCOPE_VIOLATION" | "REPLAY_MISMATCH" | "CERTIFICATION_BLOCKED";

export type GovernanceLineageScenario =
  | "BASELINE"
  | "POLICY"
  | "CONSTITUTION"
  | "AUTHORITY"
  | "EVIDENCE"
  | "RISK"
  | "COMPLIANCE"
  | "RECOMMENDATION"
  | "ESCALATION"
  | "DECISION"
  | "GOVERNANCE"
  | "MISSING_ID"
  | "MISSING_TENANT"
  | "MISSING_MISSION"
  | "INVALID_TYPE"
  | "MISSING_OBJECT"
  | "MISSING_POLICY"
  | "MISSING_EVIDENCE"
  | "MISSING_REPLAY"
  | "HIDDEN_INFLUENCE"
  | "DUPLICATE_IDENTIFIER"
  | "CROSS_TENANT"
  | "HASH_MISMATCH"
  | "INVALID_TRANSITION"
  | "IMMUTABLE_MUTATION";

export type GovernanceLineageObject = Readonly<{
  governance_object: string;
  object_type: GovernanceLineageObjectType;
  object_identifier: string;
  object_version: string;
}>;

export type GovernanceInfluence = Readonly<{
  source_type: GovernanceLineageType;
  source_identifier: string;
  relationship: GovernanceLineageRelationshipType;
  weight: number;
  confidence: number;
  reason: string;
}>;

export type GovernanceLineageConfidence = Readonly<{
  confidence_score: number;
  confidence_level: "LOW" | "MODERATE" | "HIGH" | "CERTIFICATION_READY";
  confidence_method: "EVIDENCE_WEIGHTED_LINEAGE_V1";
  supporting_lineage_refs: readonly string[];
}>;

export type GovernanceLineageReplayMetadata = Readonly<{
  replay_id: string;
  reconstruction_hash: string;
  deterministic_hash: string;
  truth_record_reference: string;
  replay_timestamp: string;
}>;

export type GovernanceLineageExplanation = Readonly<{
  explanation_reference: string;
  summary: string;
  operator_visible: boolean;
  explanation_version: "GOVERNANCE-LINEAGE-EXPLANATION-V1";
}>;

export type GovernanceLineageReferences = Readonly<{
  policy_ids: readonly string[];
  constitutional_rule_ids: readonly string[];
  authority_ids: readonly string[];
  evidence_ids: readonly string[];
  risk_ids: readonly string[];
  compliance_ids: readonly string[];
  recommendation_ids: readonly string[];
  escalation_ids: readonly string[];
}>;

export type GovernanceLineageRecord = Readonly<{
  governance_lineage_id: string;
  tenant_id: string;
  mission_id: string;
  session_id: string;
  lineage_version: "GOVERNANCE-LINEAGE-CONTRACT-V1";
  created_timestamp: string;
  created_by: string;
  lineage_type: GovernanceLineageType;
  governance_object: GovernanceLineageObject;
  parent_lineage_id: string | null;
  root_lineage_id: string;
  child_lineage_ids: readonly string[];
  previous_lineage_id: string | null;
  superseded_by: string | null;
  references: GovernanceLineageReferences;
  influence_chain: readonly GovernanceInfluence[];
  confidence: GovernanceLineageConfidence;
  replay_metadata: GovernanceLineageReplayMetadata;
  explanation_metadata: GovernanceLineageExplanation;
  state: GovernanceLineageState;
  advisory_boundary: Readonly<{
    advisory_only: true;
    execution_authority: false;
    mutation_authority: false;
    policy_modification_authority: false;
    operator_override_authority: false;
  }>;
  lineage_hash: string;
}>;

export type GovernanceLineageErrorCode = "GLC-001" | "GLC-002" | "GLC-003" | "GLC-004" | "GLC-005" | "GLC-006" | "GLC-007" | "GLC-008" | "GLC-009" | "GLC-010" | "GLC-011" | "GLC-012" | "GLC-013" | "GLC-014" | "GLC-015";

export type GovernanceLineageFailureReason =
  | "MISSING_LINEAGE_ID"
  | "DUPLICATE_LINEAGE_ID"
  | "MISSING_TENANT_ID"
  | "MISSING_MISSION_ID"
  | "INVALID_LINEAGE_TYPE"
  | "MISSING_GOVERNANCE_OBJECT"
  | "MISSING_POLICY_REFERENCE"
  | "MISSING_EVIDENCE_REFERENCE"
  | "MISSING_REPLAY_METADATA"
  | "HIDDEN_INFLUENCE_DETECTED"
  | "CROSS_TENANT_REFERENCE"
  | "INVALID_STATE_TRANSITION"
  | "IMMUTABLE_FIELD_MUTATION"
  | "DETERMINISTIC_HASH_MISMATCH"
  | "LINEAGE_VALIDATION_FAILED";

export type GovernanceLineageValidationFailure = Readonly<{
  error_code: GovernanceLineageErrorCode;
  reason: GovernanceLineageFailureReason;
  field_path: string;
  message: string;
  fail_closed: true;
}>;

export type GovernanceLineageValidationResult = Readonly<{
  governance_lineage_id?: string;
  validation_state: GovernanceLineageValidationState;
  validator_version: "GOVERNANCE-LINEAGE-VALIDATOR-V1";
  checks: Readonly<{
    identity_valid: boolean;
    type_valid: boolean;
    object_valid: boolean;
    references_complete: boolean;
    influence_chain_complete: boolean;
    replay_ready: boolean;
    explanation_complete: boolean;
    state_valid: boolean;
    tenant_isolated: boolean;
    hidden_influence_absent: boolean;
    advisory_only_enforced: boolean;
    hash_valid: boolean;
  }>;
  errors: readonly GovernanceLineageValidationFailure[];
  warnings: readonly string[];
  validation_timestamp: string;
}>;

export type GovernanceLineageReplayResult = Readonly<{
  replay_id: string;
  replay_state: GovernanceLineageReplayState;
  reconstructed_hash: string;
  expected_hash: string;
  reconstructed_lineage_id: string;
  failure_reason: GovernanceLineageFailureReason | null;
}>;

export type GovernanceLineageTransitionResult = Readonly<{
  from_state: GovernanceLineageState;
  to_state: GovernanceLineageState;
  allowed: boolean;
  reason: string;
}>;

export type GovernanceLineageInfluenceResolution = Readonly<{
  governance_lineage_id: string;
  upstream_influences: readonly GovernanceInfluence[];
  downstream_lineage_ids: readonly string[];
  root_lineage_id: string;
  influence_hash: string;
}>;

export type GovernanceLineageExplanationResult = Readonly<{
  governance_lineage_id: string;
  summary: string;
  why_it_exists: string;
  policy_basis: readonly string[];
  evidence_basis: readonly string[];
  risk_basis: readonly string[];
  compliance_basis: readonly string[];
  escalation_basis: readonly string[];
  confidence_basis: string;
  operator_visible: boolean;
  explanation_hash: string;
}>;

export type GovernanceLineageObservabilitySurface = Readonly<{
  governance_lineage_id: string;
  lineage_type: GovernanceLineageType;
  object_identifier: string;
  state: GovernanceLineageState;
  parent_lineage_id: string | null;
  root_lineage_id: string;
  child_lineage_ids: readonly string[];
  influence_count: number;
  evidence_refs: readonly string[];
  policy_refs: readonly string[];
  replay_state: GovernanceLineageReplayState;
  truth_record_reference: string;
  explanation_summary: string;
  advisory_only_notice: string;
  validation_failures: readonly GovernanceLineageFailureReason[];
}>;

export type GovernanceLineageDoctrine = Readonly<{
  principles: readonly ("immutable" | "deterministic" | "replay-safe" | "explainable" | "auditable" | "evidence-driven" | "constitution-aware" | "policy-aware" | "advisory-only" | "tenant-safe" | "fail-closed" | "certification-ready")[];
  supported_lineage_types: readonly GovernanceLineageType[];
  supported_relationships: readonly GovernanceLineageRelationshipType[];
  supported_states: readonly GovernanceLineageState[];
  contract_version: "GOVERNANCE-LINEAGE-CONTRACT-V1";
}>;
