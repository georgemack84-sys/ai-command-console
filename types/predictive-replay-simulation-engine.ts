import type { CognitiveExplainabilityRepository } from "@/types/cognitive-explainability-engine";
import type { ForecastConfidenceRepository } from "@/types/forecast-confidence-engine";
import type { MultiDomainRepository } from "@/types/multi-domain-prediction-engine";
import type { PredictionKnowledgeRepository } from "@/types/prediction-knowledge-repository";
import type { PreventativeRecommendationReport } from "@/types/preventative-recommendation-engine";
import type { RiskForecastingReport } from "@/types/risk-forecasting-engine";

export type PredictiveSimulationType = "HISTORICAL_REPLAY" | "FORECAST_VALIDATION" | "FUTURE_SCENARIO" | "STRESS_SIMULATION" | "MITIGATION_ANALYSIS" | "RECOVERY_SIMULATION" | "RESOURCE_SIMULATION" | "MISSION_SIMULATION" | "CERTIFICATION_SIMULATION";
export type PredictiveReplayState = "REQUESTED" | "RECONSTRUCTING" | "VALIDATING" | "SIMULATING" | "COMPARING" | "VERIFIED" | "CERTIFIED";
export type PredictiveSimulationPipelineState = "REQUEST_RECEIVED" | "PREDICTION_LOOKUP" | "HISTORICAL_REPLAY" | "SCENARIO_SIMULATION" | "MITIGATION_EVALUATION" | "ACCURACY_MEASUREMENT" | "GOVERNANCE_VALIDATION" | "REPLAY_VALIDATION" | "EXPLAINABILITY_GENERATION" | "PUBLISHED" | "REJECTED";

export type PredictiveReplaySimulationScenario =
  | "BASELINE"
  | "PRODUCTION_STATE_MUTATION"
  | "AUTONOMOUS_MITIGATION_EXECUTION"
  | "GOVERNANCE_MODIFICATION_ATTEMPT"
  | "MODEL_MODIFICATION_DURING_REPLAY"
  | "REPLAY_INCONSISTENCY"
  | "CROSS_TENANT_REPLAY";

export type PredictiveReplaySimulationFailure =
  | "REPLAY_CONTRACT_INVALID"
  | "SIMULATION_SCHEMA_INVALID"
  | "FORECAST_REPLAY_NONDETERMINISTIC"
  | "HISTORICAL_VALIDATION_NONDETERMINISTIC"
  | "FUTURE_SIMULATION_NONDETERMINISTIC"
  | "MITIGATION_ANALYSIS_NONDETERMINISTIC"
  | "REPLAY_REPRODUCIBILITY_INVALID"
  | "PREDICTION_ACCURACY_NONDETERMINISTIC"
  | "EVIDENCE_RECONSTRUCTION_MISMATCH"
  | "CONFIDENCE_RECONSTRUCTION_MISMATCH"
  | "RECOMMENDATION_RECONSTRUCTION_MISMATCH"
  | "SCENARIO_ASSUMPTIONS_MISSING"
  | "SCENARIO_LIMITATIONS_MISSING"
  | "EXPLAINABILITY_INCOMPLETE"
  | "GOVERNANCE_VALIDATION_MISSING"
  | "CONSTITUTIONAL_COMPLIANCE_MISSING"
  | "LINEAGE_REFERENCES_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "INTEGRITY_HASH_INVALID"
  | "PRODUCTION_STATE_MUTATION_DETECTED"
  | "AUTONOMOUS_MITIGATION_EXECUTED"
  | "AUTONOMOUS_GOVERNANCE_MODIFICATION_DETECTED"
  | "PREDICTION_MODEL_MODIFICATION_DETECTED"
  | "REPLAY_INCONSISTENCY_DETECTED"
  | "TENANT_ISOLATION_INVALID"
  | "CROSS_TENANT_REPLAY_DETECTED"
  | "ADVISORY_ONLY_VIOLATION";

export type AccuracyMetrics = Readonly<{
  forecast_accuracy: number;
  replay_fidelity: number;
  mitigation_success: number;
  simulation_reliability: number;
  precision: number;
  recall: number;
  false_positive_rate: number;
  false_negative_rate: number;
  metrics_hash: string;
}>;

export type PredictiveSimulationObject = Readonly<{
  simulation_id: string;
  prediction_id: string;
  forecast_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  pipeline_state: PredictiveSimulationPipelineState;
  replay_state: PredictiveReplayState;
  simulation_type: PredictiveSimulationType;
  scenario_name: string;
  scenario_description: string;
  historical_replay: readonly string[];
  future_projection: readonly string[];
  mitigation_analysis: readonly string[];
  prediction_accuracy: AccuracyMetrics;
  forecast_validation: readonly string[];
  replay_consistency: number;
  confidence_assessment: readonly string[];
  governance_validation: "PASS" | "FAIL";
  constitutional_validation: "PASS" | "FAIL";
  recommendations: readonly string[];
  limitations: readonly string[];
  assumptions: readonly string[];
  explanation: readonly string[];
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  generated_at: string;
  version: "predictive-replay-simulation-engine/v8ALT.3.9";
  advisory_only: true;
  production_state_modified: boolean;
  mitigation_executed: boolean;
  governance_modified: boolean;
  prediction_model_modified: boolean;
  recovery_executed: boolean;
  simulation_hash: string;
}>;

export type PredictiveSimulationLedger = Readonly<{
  ledger_id: string;
  tenant_id: string;
  mission_id: string;
  replay_records: readonly string[];
  simulation_records: readonly PredictiveSimulationObject[];
  validation_reports: readonly string[];
  mitigation_analyses: readonly string[];
  prediction_accuracy_metrics: readonly string[];
  replay_references: readonly string[];
  lineage_references: readonly string[];
  integrity_hashes: readonly string[];
  source_risk_report: RiskForecastingReport;
  source_recommendation_report: PreventativeRecommendationReport;
  source_knowledge_repository: PredictionKnowledgeRepository;
  source_explainability_repository: CognitiveExplainabilityRepository;
  source_confidence_repository: ForecastConfidenceRepository;
  source_multi_domain_repository: MultiDomainRepository;
  append_only: true;
  ledger_hash: string;
}>;

export type PredictiveReplaySimulationInput = Readonly<{
  scenario?: PredictiveReplaySimulationScenario;
  tenant_id?: string;
  mission_id?: string;
  risk_report?: RiskForecastingReport;
  recommendation_report?: PreventativeRecommendationReport;
  knowledge_repository?: PredictionKnowledgeRepository;
  explainability_repository?: CognitiveExplainabilityRepository;
  confidence_repository?: ForecastConfidenceRepository;
  multi_domain_repository?: MultiDomainRepository;
}>;

export type PredictiveReplaySimulationReplayResult = Readonly<{
  replay_reference: string;
  ledger_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_result_hash: string;
}>;

export type PredictiveReplaySimulationValidationResult = Readonly<{
  ledger_id: string | null;
  valid: boolean;
  replay_contract_valid: boolean;
  simulation_schema_valid: boolean;
  deterministic_forecast_replay_reproducible: boolean;
  historical_prediction_validation_reproducible: boolean;
  future_scenario_simulation_deterministic: boolean;
  mitigation_effectiveness_analysis_reproducible: boolean;
  replay_reproducibility_verified: boolean;
  prediction_accuracy_measurement_reproducible: boolean;
  replay_reconstructs_identical_evidence: boolean;
  replay_reconstructs_identical_confidence: boolean;
  replay_reconstructs_identical_recommendations: boolean;
  scenario_assumptions_documented: boolean;
  scenario_limitations_documented: boolean;
  explainability_complete: boolean;
  governance_validation_enforced: boolean;
  constitutional_compliance_verified: boolean;
  lineage_preserved: boolean;
  replay_references_preserved: boolean;
  integrity_hashes_reproducible: boolean;
  production_state_mutation_rejected: boolean;
  autonomous_mitigation_rejected: boolean;
  autonomous_governance_modification_rejected: boolean;
  prediction_model_modification_rejected: boolean;
  replay_inconsistency_detected: boolean;
  tenant_isolation_enforced: boolean;
  cross_tenant_replay_rejected: boolean;
  advisory_only_behavior_enforced: boolean;
  failures: readonly PredictiveReplaySimulationFailure[];
  validation_hash: string;
}>;

export type PredictiveReplaySimulationObservabilitySurface = Readonly<{
  ledger_id: string;
  tenant_id: string;
  mission_id: string;
  simulation_count: number;
  replay_record_count: number;
  average_replay_consistency: number;
  average_forecast_accuracy: number;
  advisory_only: true;
  ledger_hash: string;
}>;

export type PredictiveReplaySimulationEngineContract = Readonly<{
  doctrine: Readonly<{
    engine_version: "predictive-replay-simulation-engine/v8ALT.3.9";
    principles: readonly string[];
    simulation_types: readonly PredictiveSimulationType[];
    replay_states: readonly PredictiveReplayState[];
    pipeline_states: readonly PredictiveSimulationPipelineState[];
    advisory_only: true;
  }>;
  ledger: PredictiveSimulationLedger;
  validation: PredictiveReplaySimulationValidationResult;
  replay: PredictiveReplaySimulationReplayResult;
  observability: PredictiveReplaySimulationObservabilitySurface;
}>;
