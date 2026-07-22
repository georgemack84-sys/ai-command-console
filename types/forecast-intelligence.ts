export type ForecastCertificationStatus = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type ForecastType = "OUTCOME" | "RISK" | "CONFIDENCE" | "RESOURCE" | "TEMPORAL" | "PORTFOLIO";
export type ForecastLifecycleState = "REGISTERED" | "INPUT_VALIDATED" | "MODEL_BOUND" | "FORECAST_GENERATED" | "UNCERTAINTY_QUANTIFIED" | "CALIBRATED" | "REVIEWED" | "CERTIFIED" | "IMMUTABLE" | "FAILED" | "RECORDED" | "REPLAYABLE";
export type ForecastReplayOutcome = "MATCH" | "EXPECTED_VARIANCE" | "REQUIRES_INVESTIGATION" | "FAILURE";
export type ForecastFailureCategory = "insufficient evidence" | "unsupported scenario" | "invalid strategy" | "policy violation" | "authority violation" | "model unavailable" | "replay mismatch" | "timeout" | "integrity failure" | "uncertainty exceeds threshold" | "indeterminate outcome";
export type ForecastIntelligenceFailure =
  | "FORECAST_ARTIFACT_CONTRACT_INVALID"
  | "FORECAST_IDENTITY_NONDETERMINISTIC"
  | "MODEL_REGISTRY_INCOMPLETE"
  | "MODEL_BINDING_MUTABLE"
  | "UNKNOWN_MODEL"
  | "EXPIRED_MODEL"
  | "REVOKED_MODEL"
  | "UNCERTIFIED_MODEL"
  | "INPUT_VALIDATION_FAILED"
  | "INCOMPLETE_STRATEGY"
  | "UNQUALIFIED_SCENARIO"
  | "UNSUPPORTED_VARIABLES"
  | "EVIDENCE_MISSING"
  | "INVALID_ASSUMPTIONS"
  | "POLICY_MANIFEST_MISSING"
  | "GOVERNANCE_APPROVAL_MISSING"
  | "AUTHORITY_VIOLATION"
  | "HIDDEN_UNCERTAINTY"
  | "CONFIDENCE_UNCERTAINTY_MERGED"
  | "CALIBRATION_HISTORY_MUTABLE"
  | "FAILED_FORECAST_NOT_PRESERVED"
  | "INDETERMINATE_FORECAST_NOT_PRESERVED"
  | "REPLAY_MISMATCH"
  | "INTEGRITY_VALIDATION_FAILED"
  | "TENANT_ISOLATION_BREACH"
  | "ADVISORY_BOUNDARY_VIOLATION"
  | "LEDGER_NOT_APPEND_ONLY"
  | "OBSERVABILITY_MISSING";
export type ForecastIntelligenceScenario = "BASELINE" | ForecastIntelligenceFailure;

export type ForecastIntelligenceInput = Readonly<{ scenario?: ForecastIntelligenceScenario; tenant_id?: string; recommendation_cycle_ref?: string }>;

export type ForecastArtifact = Readonly<{
  forecast_id: string;
  forecast_type: ForecastType;
  strategy_ref: string;
  scenario_ref: string;
  forecast_horizon: string;
  forecast_variables: readonly string[];
  predicted_outcomes: readonly string[];
  confidence_intervals: readonly string[];
  uncertainty_sources: readonly string[];
  forecast_confidence: number;
  forecast_uncertainty: number;
  model_ref: string;
  model_version: string;
  model_configuration_hash: string;
  evidence_refs: readonly string[];
  assumptions: readonly string[];
  policy_manifest_ref: string;
  recommendation_cycle_ref: string;
  authority_ref: string;
  origin_ref: string;
  created_timestamp: string;
  certification_status: ForecastCertificationStatus;
  lifecycle_state: ForecastLifecycleState;
  advisory_only: boolean;
  tenant_id: string;
  integrity_hash: string;
}>;

export type ForecastModelRegistry = Readonly<{
  registry_id: string;
  models: readonly Readonly<{ model_ref: string; version: string; algorithm_class: string; parameter_set_hash: string; supported_variables: readonly string[]; supported_horizons: readonly string[]; supported_scenario_classes: readonly string[]; governance_approved: boolean; certified: boolean; immutable: boolean; revoked: boolean; expired: boolean; integrity_hash: string }>[];
  complete: boolean;
  integrity_hash: string;
}>;

export type ModelBindingReport = Readonly<{ report_id: string; bindings: readonly Readonly<{ forecast_id: string; model_ref: string; version: string; immutable: boolean; valid: boolean; integrity_hash: string }>[]; unknown_models: readonly string[]; invalid_versions: readonly string[]; integrity_hash: string }>;
export type ForecastInputValidationReport = Readonly<{ report_id: string; strategy_valid: boolean; scenario_valid: boolean; assumptions_valid: boolean; evidence_valid: boolean; variables_valid: boolean; temporal_valid: boolean; policy_valid: boolean; governance_valid: boolean; authority_valid: boolean; recommendation_cycle_valid: boolean; rejected_forecast_ids: readonly string[]; integrity_hash: string }>;
export type ForecastUncertaintyReport = Readonly<{ report_id: string; confidence_score: number; uncertainty_score: number; uncertainty_contributors: readonly string[]; sensitivity_ranking: readonly string[]; confidence_separated_from_uncertainty: boolean; explanation: string; integrity_hash: string }>;
export type ForecastCalibrationReport = Readonly<{ report_id: string; history_immutable: boolean; reliability_score: number; accuracy_metrics: Readonly<Record<string, number>>; calibration_error: number; drift_indicator: number; integrity_hash: string }>;
export type ForecastFailureRecord = Readonly<{ failure_id: string; forecast_id: string; category: ForecastFailureCategory; failure_evidence: readonly string[]; timestamp: string; originating_cycle: string; affected_strategy: string; affected_scenario: string; recovery_recommendation: string; preserved: boolean; replayable: boolean; integrity_hash: string }>;
export type ForecastReplayReport = Readonly<{ report_id: string; outcome: ForecastReplayOutcome; identical_inputs: boolean; identical_outputs: boolean; identical_model_version: boolean; identical_assumptions: boolean; identical_uncertainty: boolean; identical_confidence: boolean; integrity_hash: string }>;
export type ForecastLedger = Readonly<{ ledger_id: string; append_only: boolean; immutable: boolean; entries: readonly Readonly<{ entry_id: string; type: string; subject_id: string; integrity_hash: string }>[]; integrity_hash: string }>;
export type ForecastRegistry = Readonly<{ registry_id: string; tenant_id: string; forecasts: readonly ForecastArtifact[]; failures: readonly ForecastFailureRecord[]; complete: boolean; integrity_hash: string }>;
export type ForecastObservabilityReport = Readonly<{ report_id: string; generation_latency_ms: number; replay_success_rate: number; calibration_accuracy: number; model_usage_count: number; uncertainty_average: number; failed_forecasts: number; replay_mismatches: number; governance_violations: number; registry_integrity: boolean; ledger_integrity: boolean; observable: boolean; integrity_hash: string }>;

export type ForecastCertificationTest = Readonly<{ test_id: string; name: string; expected: "PASS"; actual: "PASS" | "FAIL"; passed: boolean; failure_reason: ForecastIntelligenceFailure | null; evidence_refs: readonly string[]; integrity_hash: string }>;
export type ForecastIntelligenceCertification = Readonly<{ certification_id: string; status: ForecastCertificationStatus; ready_for_strategy_evaluation: boolean; failures: readonly ForecastIntelligenceFailure[]; tests: readonly ForecastCertificationTest[]; integrity_hash: string }>;

export type ForecastIntelligenceResult = Readonly<{
  phase_version: "forecast-intelligence/v12.6";
  phase_identifier: "ForecastIntelligence";
  model_registry: ForecastModelRegistry;
  forecasts: readonly ForecastArtifact[];
  model_binding: ModelBindingReport;
  input_validation: ForecastInputValidationReport;
  uncertainty: ForecastUncertaintyReport;
  calibration: ForecastCalibrationReport;
  failure_records: readonly ForecastFailureRecord[];
  replay: ForecastReplayReport;
  registry: ForecastRegistry;
  ledger: ForecastLedger;
  observability: ForecastObservabilityReport;
  certification: ForecastIntelligenceCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ForecastIntelligenceValidation = Readonly<{ registry_id: string | null; valid: boolean; status: ForecastCertificationStatus; ready_for_strategy_evaluation: boolean; failures: readonly ForecastIntelligenceFailure[]; replay_hash_valid: boolean; integrity_hash_valid: boolean; model_binding_valid: boolean; registry_valid: boolean; validation_hash: string }>;

export type ForecastIntelligenceContractBundle = Readonly<{
  doctrine: Readonly<{ version: "forecast-intelligence/v12.6"; advisory_only: true; immutable_model_binding_required: true; confidence_uncertainty_separation_required: true; calibration_history_immutable: true; failures_preserved: true; replay_required: true; governance_validation_required: true }>;
  result: ForecastIntelligenceResult;
  validation: ForecastIntelligenceValidation;
}>;
