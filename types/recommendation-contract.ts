export type RecommendationType =
  | "POLICY_UPDATE"
  | "CONTROL_IMPROVEMENT"
  | "ESCALATION_RECOMMENDATION"
  | "COMPLIANCE_IMPROVEMENT"
  | "REMEDIATION_RECOMMENDATION"
  | "MONITORING_RECOMMENDATION"
  | "GOVERNANCE_REVIEW_RECOMMENDATION"
  | "RISK_REDUCTION_RECOMMENDATION"
  | "CERTIFICATION_RECOMMENDATION"
  | "OPERATOR_REVIEW_RECOMMENDATION";

export type RecommendationScopeType = "LOCAL_PHASE" | "CROSS_PHASE" | "POLICY_LEVEL" | "CONTROL_LEVEL" | "COMPLIANCE_LEVEL" | "CERTIFICATION_LEVEL" | "TENANT_LEVEL" | "MISSION_LEVEL" | "ECOSYSTEM_LEVEL";
export type RecommendationEvidenceType = "POLICY_EVIDENCE" | "CONTROL_EVIDENCE" | "RISK_EVIDENCE" | "COMPLIANCE_EVIDENCE" | "LINEAGE_EVIDENCE" | "REPLAY_EVIDENCE" | "CERTIFICATION_EVIDENCE" | "OPERATOR_EVIDENCE" | "TRUTH_LEDGER_EVIDENCE";
export type RecommendationRiskCategory = "POLICY_CONFLICT_RISK" | "COMPLIANCE_GAP_RISK" | "CONTROL_WEAKNESS_RISK" | "TENANT_ISOLATION_RISK" | "AUTHORITY_EXPANSION_RISK" | "REPLAY_FAILURE_RISK" | "EVIDENCE_INTEGRITY_RISK" | "CONFIDENCE_DEGRADATION_RISK" | "CERTIFICATION_FAILURE_RISK" | "OPERATOR_VISIBILITY_RISK";
export type RecommendationSeverityLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type RecommendationConfidenceBand = "LOW_CONFIDENCE" | "MODERATE_CONFIDENCE" | "HIGH_CONFIDENCE" | "CERTIFICATION_CONFIDENCE";
export type RecommendationAlternativePathType = "PREFERRED_PATH" | "CONSERVATIVE_PATH" | "ESCALATION_PATH" | "REMEDIATION_PATH";
export type RecommendationLifecycleState = "DRAFT" | "EVIDENCE_BOUND" | "RISK_BOUND" | "CONFIDENCE_BOUND" | "GOVERNANCE_CONSTRAINED" | "VALIDATED" | "REJECTED" | "PRESENTED" | "SUPERSEDED" | "ARCHIVED";
export type RecommendationValidationState = "VALID" | "INVALID" | "UNKNOWN" | "TENANT_SCOPE_VIOLATION" | "REPLAY_MISMATCH" | "CERTIFICATION_BLOCKED";
export type RecommendationReplayState = "REPRODUCED" | "MISMATCH" | "INCOMPLETE" | "INVALID";
export type RecommendationCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type RecommendationIdentity = Readonly<{
  recommendation_id: string;
  tenant_id: string;
  mission_id: string;
  governance_intelligence_id: string;
  parent_recommendation_id: string | null;
  root_recommendation_id: string;
  contract_version: "RECOMMENDATION-CONTRACT-V1";
  created_timestamp: string;
}>;

export type RecommendationScope = Readonly<{
  scope_type: RecommendationScopeType;
  affected_phase: string;
  affected_subphase: string;
  affected_policy: string;
  affected_control: string;
  affected_tenant: string;
  affected_mission: string;
  affected_certification_gate: string | null;
}>;

export type RecommendationEvidenceRequirements = Readonly<{
  required_evidence_types: readonly RecommendationEvidenceType[];
  minimum_evidence_count: number;
  required_source_refs: readonly string[];
  required_policy_refs: readonly string[];
  required_risk_refs: readonly string[];
  required_compliance_refs: readonly string[];
  required_lineage_refs: readonly string[];
  evidence_quality_threshold: number;
  evidence_integrity_required: true;
  evidence_recency_required: true;
  conflicting_evidence_policy: "DISCLOSE_AND_FAIL_IF_UNRESOLVED";
}>;

export type RecommendationRiskRequirements = Readonly<{
  required_risk_assessment: true;
  risk_refs: readonly string[];
  addressed_risk_categories: readonly RecommendationRiskCategory[];
  introduced_risk_categories: readonly RecommendationRiskCategory[];
  residual_risk: string;
  severity_level: RecommendationSeverityLevel;
  risk_score: number;
  risk_threshold: number;
  escalation_required: boolean;
  risk_rationale: string;
}>;

export type RecommendationConfidenceRequirements = Readonly<{
  confidence_score: number;
  confidence_band: RecommendationConfidenceBand;
  confidence_threshold: number;
  confidence_inputs: Readonly<Record<string, number | string>>;
  confidence_rationale: string;
  uncertainty_factors: readonly string[];
  confidence_replay_hash: string;
}>;

export type RecommendationGovernanceConstraints = Readonly<{
  applicable_policies: readonly string[];
  applicable_controls: readonly string[];
  applicable_constitutional_rules: readonly string[];
  authority_limits: readonly string[];
  escalation_rules: readonly string[];
  certification_rules: readonly string[];
  tenant_isolation_rules: readonly string[];
  operator_review_rules: readonly string[];
}>;

export type RecommendationAdvisoryBoundary = Readonly<{
  advisory_only: true;
  execution_authority: false;
  mutation_authority: false;
  deployment_authority: false;
  approval_authority: false;
  enforcement_authority: false;
  operator_required_for_action: true;
}>;

export type RecommendationAlternativePathRequirements = Readonly<{
  alternatives_required: true;
  minimum_alternatives: number;
  required_path_types: readonly RecommendationAlternativePathType[];
}>;

export type RecommendationReplayRequirements = Readonly<{
  replay_id: string;
  input_snapshot_hash: string;
  evidence_snapshot_hash: string;
  policy_snapshot_hash: string;
  risk_snapshot_hash: string;
  confidence_snapshot_hash: string;
  recommendation_output_hash: string;
  deterministic_generation_hash: string;
  replay_expected_result: "REPRODUCED";
}>;

export type RecommendationValidationRequirements = Readonly<{
  contract_present: true;
  schema_valid: true;
  recommendation_type_valid: true;
  scope_valid: true;
  evidence_supported: true;
  risk_assessed: true;
  confidence_justified: true;
  governance_compliant: true;
  advisory_only_enforced: true;
  replay_ready: true;
  tenant_isolated: true;
  truth_ledger_linked: true;
}>;

export type RecommendationTruthLedgerRequirements = Readonly<{
  truth_record_id: string;
  recommendation_id: string;
  evidence_refs: readonly string[];
  risk_refs: readonly string[];
  confidence_refs: readonly string[];
  policy_refs: readonly string[];
  compliance_refs: readonly string[];
  validation_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  operator_visibility_refs: readonly string[];
}>;

export type RecommendationContractRecord = Readonly<{
  recommendation_id: string;
  tenant_id: string;
  mission_id: string;
  governance_intelligence_id: string;
  parent_recommendation_id: string | null;
  root_recommendation_id: string;
  recommendation_type: RecommendationType;
  recommendation_title: string;
  recommendation_summary: string;
  recommendation_scope: RecommendationScope;
  target_domain: string;
  target_policy_refs: readonly string[];
  target_control_refs: readonly string[];
  target_compliance_refs: readonly string[];
  evidence_requirements: RecommendationEvidenceRequirements;
  evidence_refs: readonly string[];
  evidence_lineage_hash: string;
  risk_requirements: RecommendationRiskRequirements;
  risk_refs: readonly string[];
  risk_score: number;
  severity_level: RecommendationSeverityLevel;
  confidence_requirements: RecommendationConfidenceRequirements;
  confidence_score: number;
  confidence_rationale: string;
  governance_constraints: RecommendationGovernanceConstraints;
  constitutional_constraints: readonly string[];
  advisory_boundary: RecommendationAdvisoryBoundary;
  advisory_only: true;
  prohibited_authority: readonly string[];
  alternative_path_required: RecommendationAlternativePathRequirements;
  replay_requirements: RecommendationReplayRequirements;
  validation_requirements: RecommendationValidationRequirements;
  truth_ledger_requirements: RecommendationTruthLedgerRequirements;
  truth_ledger_refs: readonly string[];
  created_timestamp: string;
  contract_version: "RECOMMENDATION-CONTRACT-V1";
  lifecycle_state: RecommendationLifecycleState;
  recommendation_hash: string;
}>;

export type RecommendationValidationFailureReason =
  | "CONTRACT_MISSING"
  | "UNSUPPORTED_SCHEMA_VERSION"
  | "RECOMMENDATION_ID_MISSING"
  | "TENANT_ID_MISSING"
  | "MISSION_ID_MISSING"
  | "GOVERNANCE_INTELLIGENCE_ID_MISSING"
  | "UNSUPPORTED_RECOMMENDATION_TYPE"
  | "RECOMMENDATION_SCOPE_MISSING"
  | "UNDEFINED_OR_EXCESSIVE_SCOPE"
  | "EVIDENCE_REQUIREMENTS_MISSING"
  | "EVIDENCE_MISSING"
  | "EVIDENCE_LINEAGE_MISSING"
  | "RISK_REQUIREMENTS_MISSING"
  | "RISK_RATIONALE_MISSING"
  | "CONFIDENCE_REQUIREMENTS_MISSING"
  | "CONFIDENCE_UNSUPPORTED"
  | "GOVERNANCE_CONSTRAINTS_MISSING"
  | "ADVISORY_ONLY_BOUNDARY_MISSING"
  | "EXECUTION_AUTHORITY_DETECTED"
  | "MUTATION_AUTHORITY_DETECTED"
  | "REPLAY_REQUIREMENTS_MISSING"
  | "TRUTH_LEDGER_LINKAGE_MISSING"
  | "TENANT_SCOPE_VIOLATION"
  | "HIDDEN_STATE_DETECTED"
  | "RECOMMENDATION_HASH_MISMATCH"
  | "IMMUTABLE_FIELD_MUTATION";

export type RecommendationValidationFailure = Readonly<{
  failure_id: string;
  reason: RecommendationValidationFailureReason;
  field_path: string;
  message: string;
  fail_closed: true;
}>;

export type RecommendationValidationResult = Readonly<{
  recommendation_id?: string;
  validation_state: RecommendationValidationState;
  validator_version: "RECOMMENDATION-CONTRACT-VALIDATOR-V1";
  checks: Readonly<{
    contract_present: boolean;
    schema_valid: boolean;
    recommendation_type_valid: boolean;
    scope_valid: boolean;
    evidence_supported: boolean;
    evidence_lineage_present: boolean;
    risk_assessed: boolean;
    confidence_justified: boolean;
    governance_compliant: boolean;
    advisory_only_enforced: boolean;
    replay_ready: boolean;
    tenant_isolated: boolean;
    truth_ledger_linked: boolean;
    immutable_identity_valid: boolean;
    hidden_state_absent: boolean;
    hash_valid: boolean;
  }>;
  errors: readonly RecommendationValidationFailure[];
  warnings: readonly string[];
  validation_timestamp: string;
}>;

export type RecommendationReplayResult = Readonly<{
  replay_id: string;
  recommendation_id: string;
  replay_state: RecommendationReplayState;
  reconstructed_hash: string;
  expected_hash: string;
  reconstructed_validation_state: RecommendationValidationState;
  expected_validation_state: RecommendationValidationState;
  failure_reason: RecommendationValidationFailureReason | null;
}>;

export type RecommendationContractDoctrine = Readonly<{
  principles: readonly ("typed" | "scoped" | "evidence-supported" | "risk-aware" | "confidence-justified" | "governance-compliant" | "advisory-only" | "tenant-safe" | "truth-ledger-linked" | "replayable" | "certification-ready" | "fail-closed")[];
  recommendation_types: readonly RecommendationType[];
  scope_types: readonly RecommendationScopeType[];
  lifecycle_states: readonly RecommendationLifecycleState[];
  prohibited_actions: readonly string[];
  contract_version: "RECOMMENDATION-CONTRACT-V1";
}>;

export type RecommendationObservabilitySurface = Readonly<{
  recommendation_id: string;
  recommendation_type: RecommendationType;
  recommendation_summary: string;
  evidence_basis: readonly string[];
  risk_basis: readonly string[];
  confidence_basis: Readonly<{ score: number; band: RecommendationConfidenceBand; rationale: string }>;
  governance_constraints: RecommendationGovernanceConstraints;
  alternative_paths: RecommendationAlternativePathRequirements;
  validation_result: RecommendationValidationState;
  replay_status: RecommendationReplayState;
  advisory_only_notice: string;
  truth_ledger_refs: readonly string[];
  validation_failures: readonly RecommendationValidationFailureReason[];
}>;

export type RecommendationLifecycleTransitionResult = Readonly<{
  from_state: RecommendationLifecycleState;
  to_state: RecommendationLifecycleState;
  allowed: boolean;
  reason: string;
}>;
