export type GovernanceRiskCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type GovernanceRiskCertificationPhase = "7C";
export type GovernanceRiskCertificationComponentStatus = "PASS" | "CONDITIONAL_PASS" | "FAIL" | "SKIPPED";
export type GovernanceRiskCertificationRecommendedAction = "PROCEED_TO_NEXT_GOVERNANCE_INTELLIGENCE_PHASE" | "LIMITED_PROGRESSION_WITH_REVIEW" | "BLOCK_PHASE_PROGRESSION";
export type GovernanceRiskCertificationValidationState = "VALID" | "INVALID" | "REPLAY_REFERENCE_MISSING" | "LINEAGE_REFERENCE_MISSING" | "TENANT_SCOPE_VIOLATION" | "REPLAY_MISMATCH";

export type GovernanceRiskCertificationFailureReason =
  | "CONTRACT_MISSING"
  | "UNSUPPORTED_SCHEMA_VERSION"
  | "CERTIFICATION_ID_MISSING"
  | "TENANT_ID_MISSING"
  | "MISSION_ID_MISSING"
  | "INVALID_CERTIFICATION_STATE"
  | "COMPONENT_VALIDATION_MISSING"
  | "TEST_RESULTS_MISSING"
  | "EVIDENCE_REFS_MISSING"
  | "LINEAGE_REFS_MISSING"
  | "REPLAY_REFS_MISSING"
  | "CERTIFICATION_MODEL_VERSION_MISSING"
  | "EXPLANATION_MISSING"
  | "RECOMMENDED_ACTION_MISSING"
  | "TENANT_SCOPE_VIOLATION"
  | "CERTIFICATION_HASH_MISMATCH"
  | "REPLAY_PACKAGE_MISSING"
  | "REPLAY_MISMATCH";

export type GovernanceRiskValidatedComponents = Readonly<{
  risk_contract: GovernanceRiskCertificationComponentStatus;
  source_registry: GovernanceRiskCertificationComponentStatus;
  pattern_detection: GovernanceRiskCertificationComponentStatus;
  weakness_analysis: GovernanceRiskCertificationComponentStatus;
  risk_scoring: GovernanceRiskCertificationComponentStatus;
  confidence_scoring: GovernanceRiskCertificationComponentStatus;
  replay: GovernanceRiskCertificationComponentStatus;
  lineage: GovernanceRiskCertificationComponentStatus;
  tenant_isolation: GovernanceRiskCertificationComponentStatus;
  operator_visibility: GovernanceRiskCertificationComponentStatus;
  hidden_state: GovernanceRiskCertificationComponentStatus;
}>;

export type GovernanceRiskCertificationTestResults = Readonly<{
  total: number;
  passed: number;
  failed: number;
  conditional: number;
  skipped: number;
}>;

export type GovernanceRiskCertificationReplayPackage = Readonly<{
  governance_risk_certification_id: string;
  tenant_id: string;
  mission_id: string;
  certification_model_version: "GOV-RISK-CERT-V1";
  test_suite_version: "GOV-RISK-CERT-SUITE-V1";
  validated_artifact_versions: Readonly<Record<string, string>>;
  test_input_refs: readonly string[];
  test_result_refs: readonly string[];
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  certification_hash: string;
}>;

export type GovernanceRiskCertificationRecord = Readonly<{
  contract_version: "GOV-RISK-CERT-CONTRACT-V1";
  governance_risk_certification_id: string;
  tenant_id: string;
  mission_id: string;
  phase: GovernanceRiskCertificationPhase;
  phase_name: "Governance Risk Intelligence";
  certification_gate: "7C.5";
  certification_state: GovernanceRiskCertificationState;
  certification_timestamp: string;
  validated_components: GovernanceRiskValidatedComponents;
  test_results: GovernanceRiskCertificationTestResults;
  artifacts_validated: readonly string[];
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  certification_model_version: "GOV-RISK-CERT-V1";
  test_suite_version: "GOV-RISK-CERT-SUITE-V1";
  certification_replay_package: GovernanceRiskCertificationReplayPackage;
  explanation: string;
  recommended_next_action: GovernanceRiskCertificationRecommendedAction;
  truth_ledger_write_required: true;
  certification_hash: string;
}>;

export type GovernanceRiskCertificationValidationFailure = Readonly<{
  failure_id: string;
  reason: GovernanceRiskCertificationFailureReason;
  field_path: string;
  message: string;
  fail_closed: true;
}>;

export type GovernanceRiskCertificationValidationResult = Readonly<{
  governance_risk_certification_id?: string;
  validation_state: GovernanceRiskCertificationValidationState;
  validator_version: "GOV-RISK-CERT-VALIDATOR-V1";
  checks: Readonly<{
    schema_valid: boolean;
    required_fields_present: boolean;
    decision_valid: boolean;
    components_present: boolean;
    test_results_valid: boolean;
    evidence_refs_valid: boolean;
    lineage_refs_valid: boolean;
    replay_refs_valid: boolean;
    tenant_isolation_valid: boolean;
    replay_package_valid: boolean;
  }>;
  errors: readonly GovernanceRiskCertificationValidationFailure[];
  warnings: readonly string[];
  validation_timestamp: string;
}>;

export type GovernanceRiskCertificationReplayResult = Readonly<{
  replay_id: string;
  governance_risk_certification_id: string;
  validation_state: "PASS" | "FAIL";
  reconstructed_hash: string;
  expected_hash: string;
  failure_reason: GovernanceRiskCertificationFailureReason | null;
}>;

export type GovernanceRiskCertificationReport = Readonly<{
  phase: GovernanceRiskCertificationPhase;
  phase_name: "Governance Risk Intelligence";
  certification_gate: "7C.5";
  certification_state: GovernanceRiskCertificationState;
  summary: Readonly<{
    risk_contract_valid: boolean;
    risk_sources_registered: boolean;
    pattern_detection_deterministic: boolean;
    weakness_analysis_explainable: boolean;
    scoring_deterministic: boolean;
    confidence_reproducible: boolean;
    replay_successful: boolean;
    lineage_preserved: boolean;
    tenant_isolation_enforced: boolean;
    hidden_state_prohibited: boolean;
    operator_visibility_complete: boolean;
  }>;
  test_summary: GovernanceRiskCertificationTestResults;
  artifacts_validated: readonly string[];
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  certification_hash: string;
  decision_explanation: string;
  recommended_next_action: GovernanceRiskCertificationRecommendedAction;
}>;

export type GovernanceRiskCertificationDoctrine = Readonly<{
  principles: readonly ("deterministic" | "replayable" | "explainable" | "tenant-safe" | "evidence-backed" | "lineage-preserving" | "operator-visible" | "advisory-only" | "fail-closed")[];
  prohibited_behaviors: readonly string[];
  allowed_states: readonly GovernanceRiskCertificationState[];
  required_components: readonly (keyof GovernanceRiskValidatedComponents)[];
  certification_model_version: "GOV-RISK-CERT-V1";
}>;
