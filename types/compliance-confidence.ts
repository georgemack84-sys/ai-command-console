import type { ComplianceConfidenceLevel, ComplianceEvaluationScope, ComplianceReplayState, ComplianceType } from "./compliance-contract";
import type { ComplianceEvaluationRecord, EvidenceValidationState } from "./compliance-evaluation";
import type { ComplianceTrendRecord } from "./compliance-trend";

export type ComplianceConfidenceType = "COMPLIANCE_CONFIDENCE" | "EVIDENCE_CONFIDENCE" | "RECOMMENDATION_CONFIDENCE";
export type EvidenceConfidenceState = "COMPLETE_TRUSTED" | "COMPLETE_WITH_MINOR_GAPS" | "PARTIAL" | "CONFLICTING" | "MISSING" | "INVALID" | "TAMPERED" | "UNKNOWN";
export type AuthorityVerificationState = "VERIFIED" | "PARTIAL" | "UNCERTAIN" | "FAILED" | "UNKNOWN";
export type LineageIntegrityState = "INTACT" | "PARTIAL" | "BROKEN" | "UNKNOWN";
export type ConfidenceScenario = "VERY_HIGH" | "MISSING_EVIDENCE" | "INCOMPLETE_RULE_COVERAGE" | "REPLAY_MISMATCH" | "BROKEN_LINEAGE" | "POLICY_INCONSISTENCY" | "CONSTITUTIONAL_INCONSISTENCY" | "AUTHORITY_UNCERTAIN" | "VOLATILE_HISTORY" | "RECOMMENDATION_UNLINKED" | "CROSS_TENANT_INPUT" | "LEDGER_WRITE_FAILURE" | "HIDDEN_STATE";

export type ConfidenceFactorAssessment = Readonly<{
  score: number;
  state: string;
  supporting_factors: readonly string[];
  missing_factors: readonly string[];
  penalty_factors: readonly string[];
  assessment_hash: string;
}>;

export type ComplianceConfidenceInputs = Readonly<{
  evidence_completeness: number;
  rule_coverage: number;
  replay_validation: number;
  lineage_integrity: number;
  policy_consistency: number;
  constitutional_consistency: number;
  authority_verification: number;
  historical_stability: number;
  input_hash: string;
}>;

export type ConfidenceLineage = Readonly<{
  confidence_lineage_id: string;
  confidence_id: string;
  source_compliance_evaluation_id: string;
  source_evidence_refs: readonly string[];
  source_rule_refs: readonly string[];
  source_threshold_refs: readonly string[];
  source_policy_refs: readonly string[];
  source_constitution_refs: readonly string[];
  source_authority_refs: readonly string[];
  source_trend_refs: readonly string[];
  source_replay_refs: readonly string[];
  parent_confidence_refs: readonly string[];
  truth_ledger_reference: string;
  lineage_hash: string;
}>;

export type ConfidenceLedgerRecord = Readonly<{
  confidence_ledger_id: string;
  confidence_id: string;
  tenant_id: string;
  mission_id: string;
  compliance_id: string;
  confidence_type: ComplianceConfidenceType;
  confidence_level: ComplianceConfidenceLevel;
  confidence_score: number;
  confidence_inputs: ComplianceConfidenceInputs;
  supporting_factors: readonly string[];
  missing_factors: readonly string[];
  penalty_factors: readonly string[];
  lineage_reference: string;
  replay_reference: string;
  truth_ledger_reference: string;
  calculation_hash: string;
  created_timestamp: string;
}>;

export type ConfidenceReplaySnapshot = Readonly<{
  confidence_id: string;
  confidence_input_set: ComplianceConfidenceInputs;
  confidence_model_version: "COMPLIANCE-CONFIDENCE-V1";
  confidence_weights: Readonly<Record<keyof Omit<ComplianceConfidenceInputs, "input_hash">, number>>;
  confidence_penalties: readonly string[];
  confidence_blockers: readonly string[];
  source_evidence_refs: readonly string[];
  source_rule_refs: readonly string[];
  source_threshold_refs: readonly string[];
  source_policy_refs: readonly string[];
  source_authority_refs: readonly string[];
  source_lineage_refs: readonly string[];
  source_trend_refs: readonly string[];
  expected_confidence_score: number;
  expected_confidence_level: ComplianceConfidenceLevel;
  expected_calculation_hash: string;
  replay_hash: string;
}>;

export type ComplianceConfidenceRecord = Readonly<{
  contract_version: "COMPLIANCE-CONFIDENCE-V1";
  confidence_id: string;
  tenant_id: string;
  mission_id: string;
  compliance_id: string;
  compliance_evaluation_id: string;
  trend_id: string;
  evaluation_scope: ComplianceEvaluationScope;
  compliance_type: ComplianceType;
  confidence_type: ComplianceConfidenceType;
  confidence_level: ComplianceConfidenceLevel;
  confidence_score: number;
  confidence_reason: string;
  evidence_confidence: ConfidenceFactorAssessment & Readonly<{ evidence_state: EvidenceConfidenceState }>;
  rule_coverage: ConfidenceFactorAssessment & Readonly<{ covered_rules: readonly string[]; missing_rules: readonly string[]; invalid_rules: readonly string[] }>;
  consistency_confidence: ConfidenceFactorAssessment & Readonly<{ consistency_conflicts: readonly string[] }>;
  authority_confidence: ConfidenceFactorAssessment & Readonly<{ authority_verification_state: AuthorityVerificationState }>;
  lineage_confidence: ConfidenceFactorAssessment & Readonly<{ lineage_integrity_state: LineageIntegrityState; lineage_breaks: readonly string[] }>;
  replay_confidence: ConfidenceFactorAssessment & Readonly<{ replay_validation_state: ComplianceReplayState | "NOT_AVAILABLE"; replay_failure_reason: string | null }>;
  historical_stability_confidence: ConfidenceFactorAssessment;
  recommendation_basis: readonly string[];
  required_reviews: readonly string[];
  supporting_factors: readonly string[];
  missing_factors: readonly string[];
  penalty_factors: readonly string[];
  confidence_inputs: ComplianceConfidenceInputs;
  confidence_model_version: "COMPLIANCE-CONFIDENCE-V1";
  confidence_calculator_version: "COMPLIANCE-CONFIDENCE-CALC-V1";
  lineage_reference: string;
  replay_reference: string;
  truth_ledger_reference: string;
  confidence_lineage: ConfidenceLineage;
  confidence_ledger_record: ConfidenceLedgerRecord;
  replay_snapshot: ConfidenceReplaySnapshot;
  calculation_hash: string;
  created_timestamp: string;
}>;

export type ComplianceConfidenceDoctrine = Readonly<{
  principles: readonly ("deterministic" | "explainable" | "replayable" | "tenant-scoped" | "ledger-recorded" | "certification-ready" | "fail-closed")[];
  confidence_types: readonly ComplianceConfidenceType[];
  confidence_levels: readonly ComplianceConfidenceLevel[];
  weight_model: Readonly<Record<keyof Omit<ComplianceConfidenceInputs, "input_hash">, number>>;
  contract_version: "COMPLIANCE-CONFIDENCE-V1";
}>;

export type ComplianceConfidenceFailureReason =
  | "CONFIDENCE_RECORD_MISSING"
  | "UNSUPPORTED_SCHEMA_VERSION"
  | "CONFIDENCE_ID_MISSING"
  | "TENANT_ID_MISSING"
  | "MISSION_ID_MISSING"
  | "UNKNOWN_CONFIDENCE_TYPE"
  | "CONFIDENCE_INPUTS_MISSING"
  | "CONFIDENCE_MODEL_MISSING"
  | "CONFIDENCE_WEIGHTS_MISSING"
  | "SOURCE_EVALUATION_MISSING"
  | "EVIDENCE_CONFIDENCE_MISMATCH"
  | "COMPLIANCE_CONFIDENCE_MISMATCH"
  | "RECOMMENDATION_CONFIDENCE_MISMATCH"
  | "CONFIDENCE_SCORE_MISMATCH"
  | "CONFIDENCE_LEVEL_MISMATCH"
  | "CALCULATION_HASH_MISMATCH"
  | "LINEAGE_REFERENCE_MISSING"
  | "BROKEN_LINEAGE"
  | "REPLAY_REFERENCE_MISSING"
  | "REPLAY_MISMATCH"
  | "AUTHORITY_VERIFICATION_FAILED"
  | "TENANT_SCOPE_VIOLATION"
  | "LEDGER_WRITE_FAILED"
  | "HIDDEN_STATE_DETECTED";

export type ComplianceConfidenceValidationState = "VALID" | "UNKNOWN" | "TENANT_SCOPE_VIOLATION" | "CERTIFICATION_BLOCKED" | "REPLAY_MISMATCH" | "INVALID";

export type ComplianceConfidenceValidationFailure = Readonly<{
  failure_id: string;
  reason: ComplianceConfidenceFailureReason;
  field_path: string;
  message: string;
  fail_closed: true;
}>;

export type ComplianceConfidenceValidationResult = Readonly<{
  confidence_id?: string;
  validation_state: ComplianceConfidenceValidationState;
  validator_version: "COMPLIANCE-CONFIDENCE-VALIDATOR-V1";
  checks: Readonly<{
    schema_valid: boolean;
    required_fields_present: boolean;
    confidence_type_registered: boolean;
    source_evaluation_present: boolean;
    evidence_confidence_reproducible: boolean;
    compliance_confidence_reproducible: boolean;
    recommendation_confidence_reproducible: boolean;
    score_deterministic: boolean;
    level_deterministic: boolean;
    calculation_hash_valid: boolean;
    lineage_valid: boolean;
    replay_valid: boolean;
    ledger_recorded: boolean;
    tenant_isolation_valid: boolean;
    hidden_state_absent: boolean;
  }>;
  errors: readonly ComplianceConfidenceValidationFailure[];
  warnings: readonly string[];
  validation_timestamp: string;
}>;

export type ComplianceConfidenceReplayResult = Readonly<{
  replay_id: string;
  confidence_id: string;
  replay_state: ComplianceReplayState;
  reconstructed_calculation_hash: string;
  expected_calculation_hash: string;
  reconstructed_confidence_score: number;
  expected_confidence_score: number;
  reconstructed_confidence_level: ComplianceConfidenceLevel;
  expected_confidence_level: ComplianceConfidenceLevel;
  failure_reason: ComplianceConfidenceFailureReason | null;
}>;

export type ComplianceConfidenceObservabilitySurface = Readonly<{
  confidence_id: string;
  confidence_type: ComplianceConfidenceType;
  confidence_level: ComplianceConfidenceLevel;
  confidence_score: number;
  supporting_factors: readonly string[];
  missing_factors: readonly string[];
  penalty_factors: readonly string[];
  evidence_confidence_score: number;
  rule_coverage_score: number;
  replay_validation_state: ComplianceReplayState | "NOT_AVAILABLE";
  lineage_integrity_state: LineageIntegrityState;
  policy_consistency_state: string;
  constitutional_consistency_state: string;
  authority_verification_state: AuthorityVerificationState;
  historical_stability_state: string;
  calculation_hash: string;
  truth_ledger_reference: string;
  validation_failures: readonly ComplianceConfidenceFailureReason[];
}>;
