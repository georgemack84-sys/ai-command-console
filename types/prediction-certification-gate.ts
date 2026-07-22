import type { CognitiveExplainabilityRepository } from "@/types/cognitive-explainability-engine";
import type { ForecastConfidenceRepository } from "@/types/forecast-confidence-engine";
import type { HistoricalIntelligenceReport } from "@/types/historical-intelligence-engine";
import type { MultiDomainRepository } from "@/types/multi-domain-prediction-engine";
import type { PredictionKnowledgeRepository } from "@/types/prediction-knowledge-repository";
import type { PredictionObject } from "@/types/prediction-contract";
import type { PredictiveSimulationLedger } from "@/types/predictive-replay-simulation-engine";
import type { PreventativeRecommendationReport } from "@/types/preventative-recommendation-engine";
import type { RiskForecastingReport } from "@/types/risk-forecasting-engine";

export type PredictionCertificationState = "NOT_STARTED" | "INITIALIZING" | "VALIDATING" | "REPLAY_TESTING" | "GOVERNANCE_VALIDATION" | "CONSTITUTIONAL_VALIDATION" | "SECURITY_VALIDATION" | "CERTIFIED" | "CONDITIONAL_PASS" | "FAIL";
export type PredictionCertificationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type PredictionCertificationCategory = "prediction_validation" | "explainability_validation" | "replay_validation" | "confidence_validation" | "governance_validation" | "constitutional_validation" | "security_validation" | "operational_validation";

export type PredictionCertificationScenario =
  | "BASELINE"
  | "AUTONOMOUS_EXECUTION_ATTEMPT"
  | "AUTONOMOUS_MITIGATION_ATTEMPT"
  | "GOVERNANCE_MODIFICATION_ATTEMPT"
  | "CONSTITUTIONAL_MODIFICATION_ATTEMPT"
  | "LINEAGE_MUTATION"
  | "REPLAY_INCONSISTENCY"
  | "HIDDEN_PREDICTION_LOGIC"
  | "DOCUMENTATION_WARNING";

export type PredictionCertificationFailure =
  | "PREDICTION_CONTRACT_INVALID"
  | "PREDICTION_SCHEMA_INVALID"
  | "PREDICTIONS_NONDETERMINISTIC"
  | "EXPLAINABLE_FORECASTS_INCOMPLETE"
  | "CAUSAL_REASONING_NONDETERMINISTIC"
  | "SUPPORTING_EVIDENCE_INCOMPLETE"
  | "REPLAY_REPRODUCIBILITY_INVALID"
  | "PREDICTION_REPLAY_MISMATCH"
  | "RECOMMENDATION_REPLAY_MISMATCH"
  | "EXPLANATION_REPLAY_MISMATCH"
  | "CONFIDENCE_REPRODUCIBILITY_INVALID"
  | "MODEL_STABILITY_INVALID"
  | "EVIDENCE_QUALITY_INVALID"
  | "HISTORICAL_ACCURACY_INVALID"
  | "GOVERNANCE_CERTAINTY_INVALID"
  | "FORECAST_RELIABILITY_INVALID"
  | "GOVERNANCE_ENFORCEMENT_INVALID"
  | "POLICY_ENFORCEMENT_INVALID"
  | "AUTHORITY_VALIDATION_INVALID"
  | "CONSTITUTIONAL_COMPLIANCE_INVALID"
  | "OPERATOR_SUPREMACY_INVALID"
  | "GOVERNANCE_SUPREMACY_INVALID"
  | "TENANT_ISOLATION_INVALID"
  | "CROSS_TENANT_PREDICTION_ACCESS_DETECTED"
  | "OPERATOR_VISIBILITY_INCOMPLETE"
  | "PREDICTION_LINEAGE_MUTATION_DETECTED"
  | "REPLAY_REFERENCES_MISSING"
  | "INTEGRITY_HASH_INVALID"
  | "CERTIFICATION_EVIDENCE_INCOMPLETE"
  | "ADVISORY_ONLY_VIOLATION"
  | "AUTONOMOUS_EXECUTION_DETECTED"
  | "AUTONOMOUS_MITIGATION_DETECTED"
  | "AUTONOMOUS_GOVERNANCE_MODIFICATION_DETECTED"
  | "CONSTITUTIONAL_MODIFICATION_DETECTED"
  | "REPLAY_INCONSISTENCY_DETECTED"
  | "HIDDEN_PREDICTION_LOGIC_DETECTED"
  | "FAIL_CLOSED_INVALID"
  | "PRODUCTION_READINESS_BLOCKED"
  | "NON_CRITICAL_DOCUMENTATION_WARNING";

export type CertificationCategoryResult = Readonly<{
  category: PredictionCertificationCategory;
  status: PredictionCertificationOutcome;
  checks_passed: readonly string[];
  checks_failed: readonly PredictionCertificationFailure[];
  evidence_references: readonly string[];
  category_hash: string;
}>;

export type PredictionCertificationReport = Readonly<{
  certification_id: string;
  prediction_suite_version: "prediction-certification-gate/v8ALT.3.10";
  tenant_id: string;
  overall_status: PredictionCertificationOutcome;
  certification_state: PredictionCertificationState;
  prediction_validation: CertificationCategoryResult;
  explainability_validation: CertificationCategoryResult;
  replay_validation: CertificationCategoryResult;
  confidence_validation: CertificationCategoryResult;
  governance_validation: CertificationCategoryResult;
  constitutional_validation: CertificationCategoryResult;
  security_validation: CertificationCategoryResult;
  operational_validation: CertificationCategoryResult;
  tests_passed: number;
  tests_failed: number;
  tests_warning: number;
  recommendations: readonly string[];
  production_certification_ready: boolean;
  fail_closed_verified: boolean;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  certified_at: string;
  certified_by: string;
  advisory_only: true;
  autonomous_execution_detected: boolean;
  autonomous_mitigation_detected: boolean;
  governance_modified: boolean;
  constitutional_modified: boolean;
  hidden_prediction_logic_detected: boolean;
  report_hash: string;
}>;

export type PredictionCertificationLedger = Readonly<{
  ledger_id: string;
  tenant_id: string;
  certification_results: readonly PredictionCertificationReport[];
  validation_evidence: readonly string[];
  replay_reports: readonly string[];
  governance_reports: readonly string[];
  constitutional_reports: readonly string[];
  integrity_verification: readonly string[];
  lineage_references: readonly string[];
  replay_references: readonly string[];
  certification_hashes: readonly string[];
  source_prediction: PredictionObject;
  source_historical_report: HistoricalIntelligenceReport;
  source_risk_report: RiskForecastingReport;
  source_recommendation_report: PreventativeRecommendationReport;
  source_knowledge_repository: PredictionKnowledgeRepository;
  source_explainability_repository: CognitiveExplainabilityRepository;
  source_confidence_repository: ForecastConfidenceRepository;
  source_multi_domain_repository: MultiDomainRepository;
  source_simulation_ledger: PredictiveSimulationLedger;
  append_only: true;
  ledger_hash: string;
}>;

export type PredictionCertificationInput = Readonly<{
  scenario?: PredictionCertificationScenario;
  tenant_id?: string;
  mission_id?: string;
  prediction?: PredictionObject;
  historical_report?: HistoricalIntelligenceReport;
  risk_report?: RiskForecastingReport;
  recommendation_report?: PreventativeRecommendationReport;
  knowledge_repository?: PredictionKnowledgeRepository;
  explainability_repository?: CognitiveExplainabilityRepository;
  confidence_repository?: ForecastConfidenceRepository;
  multi_domain_repository?: MultiDomainRepository;
  simulation_ledger?: PredictiveSimulationLedger;
}>;

export type PredictionCertificationReplayResult = Readonly<{
  replay_reference: string;
  ledger_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_result_hash: string;
}>;

export type PredictionCertificationValidationResult = Readonly<{
  ledger_id: string | null;
  valid: boolean;
  prediction_contract_valid: boolean;
  prediction_schema_valid: boolean;
  deterministic_predictions_reproducible: boolean;
  explainable_forecasts_complete: boolean;
  causal_reasoning_chains_reproducible: boolean;
  supporting_evidence_complete: boolean;
  replay_reproducibility_verified: boolean;
  replay_reconstructs_identical_predictions: boolean;
  replay_reconstructs_identical_recommendations: boolean;
  replay_reconstructs_identical_explanations: boolean;
  confidence_reproducibility_verified: boolean;
  model_stability_reproducible: boolean;
  evidence_quality_reproducible: boolean;
  historical_accuracy_reproducible: boolean;
  governance_certainty_reproducible: boolean;
  overall_forecast_reliability_reproducible: boolean;
  governance_enforcement_validated: boolean;
  policy_enforcement_verified: boolean;
  authority_validation_enforced: boolean;
  constitutional_compliance_verified: boolean;
  operator_supremacy_preserved: boolean;
  governance_supremacy_preserved: boolean;
  tenant_isolation_enforced: boolean;
  cross_tenant_prediction_access_rejected: boolean;
  operator_visibility_complete: boolean;
  prediction_lineage_immutable: boolean;
  replay_references_preserved: boolean;
  integrity_hashes_reproducible: boolean;
  certification_evidence_complete: boolean;
  advisory_only_behavior_enforced: boolean;
  autonomous_execution_rejected: boolean;
  autonomous_mitigation_rejected: boolean;
  autonomous_governance_modification_rejected: boolean;
  constitutional_modification_rejected: boolean;
  replay_inconsistency_detected: boolean;
  hidden_prediction_logic_rejected: boolean;
  fail_closed_operation_verified: boolean;
  production_certification_readiness_confirmed: boolean;
  failures: readonly PredictionCertificationFailure[];
  validation_hash: string;
}>;

export type PredictionCertificationObservabilitySurface = Readonly<{
  ledger_id: string;
  tenant_id: string;
  certification_count: number;
  overall_status: PredictionCertificationOutcome;
  tests_passed: number;
  tests_failed: number;
  tests_warning: number;
  production_certification_ready: boolean;
  advisory_only: true;
  ledger_hash: string;
}>;

export type PredictionCertificationGateContract = Readonly<{
  doctrine: Readonly<{
    gate_version: "prediction-certification-gate/v8ALT.3.10";
    principles: readonly string[];
    certification_states: readonly PredictionCertificationState[];
    certification_outcomes: readonly PredictionCertificationOutcome[];
    certification_categories: readonly PredictionCertificationCategory[];
    pass_required_for_production: true;
    advisory_only: true;
  }>;
  ledger: PredictionCertificationLedger;
  validation: PredictionCertificationValidationResult;
  replay: PredictionCertificationReplayResult;
  observability: PredictionCertificationObservabilitySurface;
}>;
