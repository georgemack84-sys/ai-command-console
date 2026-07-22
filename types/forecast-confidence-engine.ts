import type { CognitiveExplainabilityRepository } from "@/types/cognitive-explainability-engine";
import type { PredictionKnowledgeRepository } from "@/types/prediction-knowledge-repository";
import type { PredictionObject } from "@/types/prediction-contract";
import type { RiskForecastingReport } from "@/types/risk-forecasting-engine";

export type ForecastConfidenceLevel = "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" | "VERY_LOW" | "INSUFFICIENT";
export type ForecastReliabilityLevel = "CERTIFIED" | "HIGHLY_RELIABLE" | "RELIABLE" | "CAUTION" | "UNRELIABLE" | "REJECTED";
export type ForecastUncertaintyLevel = "MINIMAL" | "LOW" | "MODERATE" | "HIGH" | "SEVERE" | "UNKNOWN";
export type ForecastConfidencePipelineState = "PREDICTION_RECEIVED" | "EVIDENCE_ANALYSIS" | "HISTORICAL_VALIDATION" | "MODEL_STABILITY_ANALYSIS" | "REPLAY_VALIDATION" | "GOVERNANCE_VALIDATION" | "CONFIDENCE_CALCULATION" | "RELIABILITY_SCORING" | "EXPLAINABILITY_GENERATION" | "PUBLISHED" | "REJECTED";

export type ForecastConfidenceScenario =
  | "BASELINE"
  | "HIDDEN_CONFIDENCE_FACTOR"
  | "CONFIDENCE_MANIPULATION"
  | "THRESHOLD_MODIFICATION_ATTEMPT"
  | "CONFIDENCE_WITHOUT_EVIDENCE"
  | "REPLAY_INCONSISTENCY"
  | "GOVERNANCE_CERTAINTY_OMITTED"
  | "CROSS_TENANT_EVALUATION";

export type ForecastConfidenceFailure =
  | "CONFIDENCE_CONTRACT_INVALID"
  | "CONFIDENCE_SCHEMA_INVALID"
  | "PREDICTION_CONFIDENCE_NONDETERMINISTIC"
  | "MODEL_STABILITY_NONDETERMINISTIC"
  | "EVIDENCE_QUALITY_NONDETERMINISTIC"
  | "HISTORICAL_ACCURACY_NONDETERMINISTIC"
  | "REPLAY_CONSISTENCY_INVALID"
  | "GOVERNANCE_CERTAINTY_NONDETERMINISTIC"
  | "OVERALL_RELIABILITY_NONDETERMINISTIC"
  | "UNCERTAINTY_LEVEL_NONDETERMINISTIC"
  | "CONFIDENCE_EXPLANATION_INCOMPLETE"
  | "CONFIDENCE_FACTORS_NOT_TRACEABLE"
  | "REPLAY_CONFIDENCE_MISMATCH"
  | "LINEAGE_REFERENCES_MISSING"
  | "INTEGRITY_HASH_INVALID"
  | "GOVERNANCE_VALIDATION_MISSING"
  | "CONSTITUTIONAL_COMPLIANCE_MISSING"
  | "HIDDEN_CONFIDENCE_FACTOR_DETECTED"
  | "CONFIDENCE_MANIPULATION_DETECTED"
  | "AUTONOMOUS_THRESHOLD_MODIFICATION_DETECTED"
  | "CONFIDENCE_WITHOUT_EVIDENCE_DETECTED"
  | "REPLAY_INCONSISTENCY_DETECTED"
  | "GOVERNANCE_CERTAINTY_OMITTED"
  | "TENANT_ISOLATION_INVALID"
  | "CROSS_TENANT_CONFIDENCE_EVALUATION_DETECTED"
  | "ADVISORY_ONLY_VIOLATION";

export type ConfidenceFactorName =
  | "prediction_confidence"
  | "model_stability"
  | "evidence_quality"
  | "historical_accuracy"
  | "replay_consistency"
  | "governance_certainty"
  | "integrity_verification"
  | "environmental_stability";

export type ConfidenceMetric = Readonly<{
  factor_name: ConfidenceFactorName;
  score: number;
  weight: number;
  weighted_score: number;
  rationale: string;
  source_references: readonly string[];
  metric_hash: string;
}>;

export type ForecastConfidenceObject = Readonly<{
  confidence_id: string;
  prediction_id: string;
  forecast_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  pipeline_state: ForecastConfidencePipelineState;
  prediction_confidence: number;
  model_stability: number;
  evidence_quality: number;
  historical_accuracy: number;
  replay_consistency: number;
  governance_certainty: number;
  integrity_verification: number;
  environmental_stability: number;
  overall_forecast_reliability: number;
  confidence_level: ForecastConfidenceLevel;
  reliability_level: ForecastReliabilityLevel;
  uncertainty_level: ForecastUncertaintyLevel;
  confidence_explanation: readonly string[];
  supporting_metrics: readonly ConfidenceMetric[];
  assumptions: readonly string[];
  limitations: readonly string[];
  governance_validation: "PASS" | "FAIL";
  constitutional_validation: "PASS" | "FAIL";
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  generated_at: string;
  version: "forecast-confidence-engine/v8ALT.3.7";
  advisory_only: true;
  prediction_modified: boolean;
  threshold_modified: boolean;
  execution_authorized: boolean;
  confidence_manipulated: boolean;
  hidden_factor_detected: boolean;
  confidence_hash: string;
}>;

export type ForecastConfidenceRepository = Readonly<{
  repository_id: string;
  tenant_id: string;
  mission_id: string;
  confidence_records: readonly ForecastConfidenceObject[];
  reliability_scores: readonly number[];
  evidence_quality_metrics: readonly string[];
  historical_performance_metrics: readonly string[];
  governance_certainty_results: readonly string[];
  replay_consistency_results: readonly string[];
  lineage_references: readonly string[];
  replay_references: readonly string[];
  integrity_hashes: readonly string[];
  source_prediction: PredictionObject;
  source_risk_report: RiskForecastingReport;
  source_knowledge_repository: PredictionKnowledgeRepository;
  source_explainability_repository: CognitiveExplainabilityRepository;
  append_only: true;
  repository_hash: string;
}>;

export type ForecastConfidenceInput = Readonly<{
  scenario?: ForecastConfidenceScenario;
  tenant_id?: string;
  mission_id?: string;
  prediction?: PredictionObject;
  risk_report?: RiskForecastingReport;
  knowledge_repository?: PredictionKnowledgeRepository;
  explainability_repository?: CognitiveExplainabilityRepository;
}>;

export type ForecastConfidenceReplayResult = Readonly<{
  replay_reference: string;
  repository_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_result_hash: string;
}>;

export type ForecastConfidenceValidationResult = Readonly<{
  repository_id: string | null;
  valid: boolean;
  confidence_contract_valid: boolean;
  confidence_schema_valid: boolean;
  prediction_confidence_reproducible: boolean;
  model_stability_calculated_deterministically: boolean;
  evidence_quality_reproducible: boolean;
  historical_accuracy_reproducible: boolean;
  replay_consistency_verified: boolean;
  governance_certainty_reproducible: boolean;
  overall_forecast_reliability_reproducible: boolean;
  uncertainty_level_deterministic: boolean;
  confidence_explanations_complete: boolean;
  confidence_factors_traceable: boolean;
  replay_reconstructs_identical_confidence_scores: boolean;
  lineage_references_preserved: boolean;
  integrity_hashes_reproducible: boolean;
  governance_validation_enforced: boolean;
  constitutional_compliance_verified: boolean;
  hidden_confidence_factors_rejected: boolean;
  confidence_manipulation_rejected: boolean;
  autonomous_threshold_modification_rejected: boolean;
  confidence_without_evidence_rejected: boolean;
  replay_inconsistency_detected: boolean;
  governance_certainty_present: boolean;
  tenant_isolation_enforced: boolean;
  cross_tenant_confidence_evaluation_rejected: boolean;
  advisory_only_behavior_enforced: boolean;
  failures: readonly ForecastConfidenceFailure[];
  validation_hash: string;
}>;

export type ForecastConfidenceObservabilitySurface = Readonly<{
  repository_id: string;
  tenant_id: string;
  mission_id: string;
  confidence_count: number;
  average_reliability: number;
  highest_confidence_level: ForecastConfidenceLevel;
  lowest_uncertainty_level: ForecastUncertaintyLevel;
  advisory_only: true;
  repository_hash: string;
}>;

export type ForecastConfidenceEngineContract = Readonly<{
  doctrine: Readonly<{
    engine_version: "forecast-confidence-engine/v8ALT.3.7";
    principles: readonly string[];
    confidence_levels: readonly ForecastConfidenceLevel[];
    reliability_levels: readonly ForecastReliabilityLevel[];
    uncertainty_levels: readonly ForecastUncertaintyLevel[];
    pipeline_states: readonly ForecastConfidencePipelineState[];
    scoring_factors: readonly ConfidenceFactorName[];
    advisory_only: true;
  }>;
  repository: ForecastConfidenceRepository;
  validation: ForecastConfidenceValidationResult;
  replay: ForecastConfidenceReplayResult;
  observability: ForecastConfidenceObservabilitySurface;
}>;
