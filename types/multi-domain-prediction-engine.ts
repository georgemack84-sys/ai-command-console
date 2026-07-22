import type { CognitiveExplainabilityRepository } from "@/types/cognitive-explainability-engine";
import type { ForecastConfidenceRepository } from "@/types/forecast-confidence-engine";
import type { PredictionKnowledgeRepository } from "@/types/prediction-knowledge-repository";
import type { PreventativeRecommendationReport } from "@/types/preventative-recommendation-engine";
import type { RiskForecastingReport } from "@/types/risk-forecasting-engine";

export type MultiDomainIntelligenceDomain = "EXECUTION" | "ORCHESTRATION" | "RUNTIME_ASSURANCE" | "RECOVERY" | "INTEGRITY" | "REPLAY" | "GOVERNANCE" | "MISSION_HEALTH";
export type MultiDomainCorrelationLevel = "NONE" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "SYSTEMIC";
export type CascadeSeverityLevel = "ISOLATED" | "LOCALIZED" | "MULTI_DOMAIN" | "MISSION_WIDE" | "ECOSYSTEM_CRITICAL";
export type MultiDomainPipelineState = "DOMAIN_COLLECTION" | "DOMAIN_VALIDATION" | "NORMALIZATION" | "CROSS_DOMAIN_CORRELATION" | "DEPENDENCY_ANALYSIS" | "CASCADING_RISK_ANALYSIS" | "FORECAST_GENERATION" | "GOVERNANCE_VALIDATION" | "REPLAY_VALIDATION" | "PUBLISHED" | "REJECTED";

export type MultiDomainScenario =
  | "BASELINE"
  | "AUTONOMOUS_INTERVENTION_ATTEMPT"
  | "GOVERNANCE_MODIFICATION_ATTEMPT"
  | "HIDDEN_DOMAIN_CORRELATION"
  | "REPLAY_INCONSISTENCY"
  | "CROSS_TENANT_CORRELATION";

export type MultiDomainFailure =
  | "MULTI_DOMAIN_CONTRACT_INVALID"
  | "CORRELATION_SCHEMA_INVALID"
  | "EXECUTION_CORRELATION_INVALID"
  | "ORCHESTRATION_CORRELATION_INVALID"
  | "RUNTIME_ASSURANCE_CORRELATION_INVALID"
  | "RECOVERY_CORRELATION_INVALID"
  | "INTEGRITY_CORRELATION_INVALID"
  | "REPLAY_CORRELATION_INVALID"
  | "GOVERNANCE_CORRELATION_INVALID"
  | "MISSION_HEALTH_CORRELATION_INVALID"
  | "DEPENDENCY_GRAPH_NONDETERMINISTIC"
  | "CASCADE_ANALYSIS_NONDETERMINISTIC"
  | "UNIFIED_PREDICTION_NONDETERMINISTIC"
  | "DOMAIN_WEIGHTS_NONDETERMINISTIC"
  | "CONFIDENCE_CALCULATION_NONDETERMINISTIC"
  | "EXPLAINABILITY_INCOMPLETE"
  | "REPLAY_CORRELATION_MISMATCH"
  | "GOVERNANCE_VALIDATION_MISSING"
  | "CONSTITUTIONAL_COMPLIANCE_MISSING"
  | "ADVISORY_ONLY_VIOLATION"
  | "AUTONOMOUS_INTERVENTION_DETECTED"
  | "AUTONOMOUS_GOVERNANCE_MODIFICATION_DETECTED"
  | "HIDDEN_DOMAIN_CORRELATION_DETECTED"
  | "REPLAY_INCONSISTENCY_DETECTED"
  | "CROSS_TENANT_CORRELATION_DETECTED"
  | "TENANT_ISOLATION_INVALID"
  | "INTEGRITY_HASH_INVALID";

export type DomainHealthProfile = Readonly<{
  domain: MultiDomainIntelligenceDomain;
  health_score: number;
  risk_score: number;
  contribution_weight: number;
  evidence_references: readonly string[];
  trend_forecast: string;
  profile_hash: string;
}>;

export type DomainDependency = Readonly<{
  dependency_id: string;
  from_domain: MultiDomainIntelligenceDomain;
  to_domain: MultiDomainIntelligenceDomain;
  correlation_level: MultiDomainCorrelationLevel;
  dependency_weight: number;
  rationale: string;
  dependency_hash: string;
}>;

export type CascadeAnalysis = Readonly<{
  cascade_id: string;
  cascade_path: readonly MultiDomainIntelligenceDomain[];
  cascade_probability: number;
  severity: CascadeSeverityLevel;
  propagation_timeline: readonly string[];
  containment_recommendations: readonly string[];
  cascade_hash: string;
}>;

export type UnifiedPredictionObject = Readonly<{
  prediction_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  pipeline_state: MultiDomainPipelineState;
  correlated_domains: readonly MultiDomainIntelligenceDomain[];
  execution_profile: DomainHealthProfile;
  orchestration_profile: DomainHealthProfile;
  runtime_profile: DomainHealthProfile;
  recovery_profile: DomainHealthProfile;
  integrity_profile: DomainHealthProfile;
  replay_profile: DomainHealthProfile;
  governance_profile: DomainHealthProfile;
  mission_health_profile: DomainHealthProfile;
  dependency_graph: readonly DomainDependency[];
  cascade_analysis: readonly CascadeAnalysis[];
  overall_risk: number;
  overall_confidence: number;
  overall_reliability: number;
  correlation_level: MultiDomainCorrelationLevel;
  recommendations: readonly string[];
  mitigation_options: readonly string[];
  explanation: readonly string[];
  governance_validation: "PASS" | "FAIL";
  constitutional_validation: "PASS" | "FAIL";
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  generated_at: string;
  version: "multi-domain-prediction-engine/v8ALT.3.8";
  advisory_only: true;
  execution_initiated: boolean;
  recovery_performed: boolean;
  governance_modified: boolean;
  model_modified: boolean;
  hidden_correlation_detected: boolean;
  prediction_hash: string;
}>;

export type MultiDomainRepository = Readonly<{
  repository_id: string;
  tenant_id: string;
  mission_id: string;
  domain_health_profiles: readonly DomainHealthProfile[];
  correlation_matrix: readonly string[];
  dependency_graphs: readonly string[];
  cascade_analyses: readonly string[];
  unified_predictions: readonly UnifiedPredictionObject[];
  prediction_summaries: readonly string[];
  replay_references: readonly string[];
  lineage_references: readonly string[];
  integrity_hashes: readonly string[];
  source_risk_report: RiskForecastingReport;
  source_recommendation_report: PreventativeRecommendationReport;
  source_knowledge_repository: PredictionKnowledgeRepository;
  source_explainability_repository: CognitiveExplainabilityRepository;
  source_confidence_repository: ForecastConfidenceRepository;
  append_only: true;
  repository_hash: string;
}>;

export type MultiDomainInput = Readonly<{
  scenario?: MultiDomainScenario;
  tenant_id?: string;
  mission_id?: string;
  risk_report?: RiskForecastingReport;
  recommendation_report?: PreventativeRecommendationReport;
  knowledge_repository?: PredictionKnowledgeRepository;
  explainability_repository?: CognitiveExplainabilityRepository;
  confidence_repository?: ForecastConfidenceRepository;
}>;

export type MultiDomainReplayResult = Readonly<{
  replay_reference: string;
  repository_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_result_hash: string;
}>;

export type MultiDomainValidationResult = Readonly<{
  repository_id: string | null;
  valid: boolean;
  multi_domain_contract_valid: boolean;
  correlation_schema_valid: boolean;
  execution_intelligence_correlated_deterministically: boolean;
  orchestration_intelligence_correlated_deterministically: boolean;
  runtime_assurance_correlated_reproducibly: boolean;
  recovery_intelligence_correlated_deterministically: boolean;
  integrity_intelligence_correlated_reproducibly: boolean;
  replay_intelligence_correlated_deterministically: boolean;
  governance_intelligence_correlated_reproducibly: boolean;
  mission_health_intelligence_correlated_deterministically: boolean;
  cross_domain_dependency_graph_reproducible: boolean;
  cascading_risk_analysis_deterministic: boolean;
  unified_prediction_reproducible: boolean;
  domain_contribution_weights_reproducible: boolean;
  confidence_calculations_deterministic: boolean;
  explainability_complete: boolean;
  replay_reconstructs_identical_correlations: boolean;
  governance_validation_enforced: boolean;
  constitutional_compliance_verified: boolean;
  advisory_only_behavior_enforced: boolean;
  autonomous_intervention_rejected: boolean;
  autonomous_governance_modification_rejected: boolean;
  hidden_domain_correlation_rejected: boolean;
  replay_inconsistency_detected: boolean;
  cross_tenant_correlation_rejected: boolean;
  tenant_isolation_enforced: boolean;
  integrity_hashes_reproducible: boolean;
  failures: readonly MultiDomainFailure[];
  validation_hash: string;
}>;

export type MultiDomainObservabilitySurface = Readonly<{
  repository_id: string;
  tenant_id: string;
  mission_id: string;
  domain_count: number;
  dependency_count: number;
  cascade_count: number;
  unified_prediction_count: number;
  highest_correlation_level: MultiDomainCorrelationLevel;
  advisory_only: true;
  repository_hash: string;
}>;

export type MultiDomainPredictionEngineContract = Readonly<{
  doctrine: Readonly<{
    engine_version: "multi-domain-prediction-engine/v8ALT.3.8";
    principles: readonly string[];
    intelligence_domains: readonly MultiDomainIntelligenceDomain[];
    correlation_levels: readonly MultiDomainCorrelationLevel[];
    cascade_severity_levels: readonly CascadeSeverityLevel[];
    pipeline_states: readonly MultiDomainPipelineState[];
    advisory_only: true;
  }>;
  repository: MultiDomainRepository;
  validation: MultiDomainValidationResult;
  replay: MultiDomainReplayResult;
  observability: MultiDomainObservabilitySurface;
}>;
