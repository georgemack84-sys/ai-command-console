export type ConfidenceOutcome = "SUCCESS" | "FAILURE" | "PARTIAL_SUCCESS";
export type ConfidenceBand = "VERY_HIGH_CONFIDENCE" | "HIGH_CONFIDENCE" | "MODERATE_CONFIDENCE" | "LOW_CONFIDENCE" | "VERY_LOW_CONFIDENCE";
export type ConfidenceAccuracyGrade = "EXCELLENT" | "GOOD" | "ACCEPTABLE" | "WEAK" | "POOR" | "CRITICAL";
export type ConfidenceBiasType = "CALIBRATED" | "OVERCONFIDENT" | "UNDERCONFIDENT" | "FALSE_CERTAINTY" | "EXCESSIVE_CAUTION" | "INCONSISTENT";
export type ConfidencePrecisionRating = "VERY_HIGH" | "HIGH" | "MODERATE" | "LOW" | "VERY_LOW";
export type ConfidenceCalibrationValidationState = "ANALYZED" | "CERTIFIED" | "FAILED" | "PENDING_EVIDENCE";

export type ConfidenceCalibrationFailure =
  | "OUTCOME_DATA_MISSING"
  | "EVIDENCE_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "TENANT_ISOLATION_VIOLATED"
  | "INTEGRITY_HASH_MISMATCH"
  | "CONFIDENCE_VALUE_MUTATION_DETECTED"
  | "REGISTRY_MUTATION_DETECTED"
  | "NONDETERMINISTIC_CALCULATION"
  | "FAIL_OPEN_BEHAVIOR";

export type ConfidenceCalibrationScenario =
  | "BASELINE"
  | "EXCELLENT"
  | "GOOD"
  | "ACCEPTABLE"
  | "WEAK"
  | "POOR"
  | "CRITICAL"
  | "OVERCONFIDENT"
  | "UNDERCONFIDENT"
  | "INCONSISTENT"
  | "MISSING_OUTCOME"
  | "MISSING_EVIDENCE"
  | "MISSING_REPLAY"
  | "MISSING_GOVERNANCE"
  | "CROSS_TENANT"
  | "HASH_MISMATCH"
  | "CONFIDENCE_MUTATION"
  | "REGISTRY_MUTATION"
  | "NONDETERMINISTIC"
  | "FAIL_OPEN";

export type CalibrationResult = Readonly<{
  calibration_result_id: string;
  decision_id: string;
  tenant_id: string;
  mission_scope: string;
  predicted_confidence: number;
  actual_outcome: ConfidenceOutcome;
  calibration_accuracy: number;
  confidence_bias: ConfidenceBiasType;
  confidence_variance: number;
  prediction_precision: number;
  confidence_consistency: number;
  uncertainty_alignment: number;
  confidence_band: ConfidenceBand;
  forecast_reliability: number;
  evaluation_timestamp: string;
  replay_refs: readonly string[];
  advisory_only: true;
  mutates_confidence: false;
  integrity_hash: string;
}>;

export type CalibrationScore = Readonly<{
  score_id: string;
  calibration_result_id: string;
  overall_score: number;
  accuracy_score: number;
  bias_score: number;
  precision_score: number;
  variance_score: number;
  consistency_score: number;
  confidence_grade: ConfidenceAccuracyGrade;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type CalibrationEvidence = Readonly<{
  evidence_id: string;
  calibration_result_id: string;
  supporting_prediction_refs: readonly string[];
  supporting_outcome_refs: readonly string[];
  evidence_quality_score: number;
  operator_decision_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type ConfidenceAccuracyReport = Readonly<{
  report_id: string;
  reporting_period: string;
  mission_scope: string;
  total_predictions: number;
  calibration_statistics: Readonly<Record<string, number>>;
  detected_biases: readonly ConfidenceBiasType[];
  consistency_analysis: string;
  precision_analysis: string;
  governance_findings: readonly string[];
  recommended_follow_up: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type ConfidenceCalibrationRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  calibration_result_refs: readonly string[];
  score_refs: readonly string[];
  report_refs: readonly string[];
  evidence_refs: readonly string[];
  grade_index: Readonly<Record<ConfidenceAccuracyGrade, readonly string[]>>;
  bias_index: Readonly<Record<ConfidenceBiasType, readonly string[]>>;
  append_only: true;
  immutable: true;
  deleted: boolean;
  integrity_hash: string;
}>;

export type ConfidenceCalibrationValidation = Readonly<{
  validation_id: string;
  state: ConfidenceCalibrationValidationState;
  certified: boolean;
  failures: readonly ConfidenceCalibrationFailure[];
  outcome_data_complete: boolean;
  evidence_complete: boolean;
  replay_complete: boolean;
  governance_complete: boolean;
  tenant_isolated: boolean;
  deterministic: boolean;
  registry_immutable: boolean;
  advisory_only: boolean;
  no_confidence_mutation: boolean;
  integrity_verified: boolean;
  integrity_hash: string;
}>;

export type ConfidenceCalibrationApiSurface = Readonly<{
  api_id: string;
  analyze_calibration: "POST /confidence-calibration-engine/analyze";
  retrieve_results: "POST /confidence-calibration-engine/results";
  retrieve_scores: "POST /confidence-calibration-engine/scores";
  retrieve_report: "POST /confidence-calibration-engine/report";
  retrieve_evidence: "POST /confidence-calibration-engine/evidence";
  retrieve_bias: "POST /confidence-calibration-engine/bias";
  retrieve_variance: "POST /confidence-calibration-engine/variance";
  retrieve_precision: "POST /confidence-calibration-engine/precision";
  retrieve_consistency: "POST /confidence-calibration-engine/consistency";
  replay_analysis: "POST /confidence-calibration-engine/replay";
  retrieve_registry: "POST /confidence-calibration-engine/registry";
  retrieve_contract: "GET /confidence-calibration-engine/contract";
  update_supported: false;
  delete_supported: false;
  confidence_mutation_supported: false;
  model_update_supported: false;
  integrity_hash: string;
}>;

export type ConfidenceCalibrationInput = Readonly<{
  scenario?: ConfidenceCalibrationScenario;
}>;

export type ConfidenceCalibrationResult = Readonly<{
  confidence_calibration_engine_version: "confidence-calibration-engine/v1";
  api_surface: ConfidenceCalibrationApiSurface;
  calibration_results: readonly CalibrationResult[];
  scores: readonly CalibrationScore[];
  evidence: readonly CalibrationEvidence[];
  report: ConfidenceAccuracyReport;
  registry: ConfidenceCalibrationRegistry;
  validation: ConfidenceCalibrationValidation;
  deterministic: true;
  replayable: true;
  explainable: boolean;
  evidence_backed: boolean;
  governance_visible: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  mutates_confidence: false;
  updates_model: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ConfidenceCalibrationFoundation = Readonly<{
  confidence_calibration_engine_version: "confidence-calibration-engine/v1";
  api_surface: ConfidenceCalibrationApiSurface;
  result: ConfidenceCalibrationResult;
}>;
