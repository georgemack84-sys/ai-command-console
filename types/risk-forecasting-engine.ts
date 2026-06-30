import type { HistoricalIntelligenceReport, HistoricalIntelligenceScenario } from "@/types/historical-intelligence-engine";

export type RiskForecastType =
  | "EXECUTION_BOTTLENECK"
  | "DEPENDENCY_FAILURE"
  | "RESOURCE_SHORTAGE"
  | "GOVERNANCE_VIOLATION"
  | "CONFIDENCE_COLLAPSE"
  | "REPLAY_INSTABILITY"
  | "INTEGRITY_DEGRADATION"
  | "ORCHESTRATION_CONGESTION"
  | "RECOVERY_PROBABILITY";

export type RiskForecastCategory = "EXECUTION" | "DEPENDENCY" | "RESOURCE" | "GOVERNANCE" | "CONFIDENCE" | "REPLAY" | "INTEGRITY" | "ORCHESTRATION" | "RECOVERY";
export type RiskForecastPipelineState = "REQUEST_RECEIVED" | "SIGNAL_COLLECTION" | "HISTORICAL_CORRELATION" | "RISK_ANALYSIS" | "FORECAST_GENERATION" | "CONFIDENCE_PROJECTION" | "GOVERNANCE_VALIDATION" | "EXPLAINABILITY_GENERATION" | "REPLAY_VALIDATION" | "PUBLISHED" | "REJECTED";
export type RiskSeverityLevel = "MINIMAL" | "LOW" | "MODERATE" | "HIGH" | "SEVERE" | "CRITICAL";
export type ForecastProbabilityLevel = "VERY_LOW" | "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH" | "NEAR_CERTAIN";
export type ForecastWindow = "IMMEDIATE" | "SHORT_TERM" | "MEDIUM_TERM" | "LONG_TERM" | "MISSION_DURATION";

export type RiskForecastScenario =
  | HistoricalIntelligenceScenario
  | "BASELINE"
  | "EXECUTION_BOTTLENECK"
  | "DEPENDENCY_FAILURE"
  | "RESOURCE_SHORTAGE"
  | "GOVERNANCE_VIOLATION"
  | "CONFIDENCE_COLLAPSE"
  | "REPLAY_INSTABILITY"
  | "INTEGRITY_DEGRADATION"
  | "ORCHESTRATION_CONGESTION"
  | "RECOVERY_PROBABILITY"
  | "MISSING_EVIDENCE"
  | "MISSING_EXPLANATION"
  | "REPLAY_MISMATCH"
  | "GOVERNANCE_INVALID"
  | "CONSTITUTIONAL_INVALID"
  | "OPERATOR_APPROVAL_MISSING"
  | "AUTONOMOUS_MITIGATION_ATTEMPT"
  | "EXECUTION_MODIFICATION_ATTEMPT"
  | "GOVERNANCE_MODIFICATION_ATTEMPT"
  | "POLICY_BYPASS"
  | "CONSTITUTIONAL_BYPASS"
  | "TENANT_ISOLATION_FAILURE"
  | "CROSS_TENANT_FORECAST"
  | "INTEGRITY_FAILURE";

export type RiskForecastFailure =
  | "FORECAST_SCHEMA_INVALID"
  | "FORECAST_TYPE_INVALID"
  | "HISTORICAL_CORRELATION_INVALID"
  | "EVIDENCE_INCOMPLETE"
  | "EXPLANATION_INCOMPLETE"
  | "CONFIDENCE_NONDETERMINISTIC"
  | "REPLAY_INVALID"
  | "GOVERNANCE_INVALID"
  | "CONSTITUTIONAL_INVALID"
  | "OPERATOR_APPROVAL_MISSING"
  | "ADVISORY_ONLY_VIOLATION"
  | "EXECUTION_MODIFICATION_DETECTED"
  | "GOVERNANCE_MODIFICATION_DETECTED"
  | "POLICY_BYPASS_DETECTED"
  | "CONSTITUTIONAL_BYPASS_DETECTED"
  | "TENANT_ISOLATION_INVALID"
  | "CROSS_TENANT_FORECAST_DETECTED"
  | "INTEGRITY_INVALID";

export type ForecastEvidence = Readonly<{
  evidence_id: string;
  source_reference: string;
  evidence_type: string;
  contribution: number;
  replay_reference: string;
  integrity_hash: string;
  evidence_hash: string;
}>;

export type HistoricalCorrelation = Readonly<{
  correlation_id: string;
  historical_signal: string;
  forecast_signal: string;
  correlation_strength: number;
  source_model: string;
  correlation_hash: string;
}>;

export type RiskForecastObject = Readonly<{
  forecast_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  forecast_type: RiskForecastType;
  forecast_category: RiskForecastCategory;
  pipeline_state: RiskForecastPipelineState;
  forecast_window: ForecastWindow;
  generated_at: string;
  expires_at: string;
  risk_probability: number;
  probability_level: ForecastProbabilityLevel;
  severity: RiskSeverityLevel;
  impact_score: number;
  projected_confidence: number;
  forecast_summary: string;
  predicted_conditions: readonly string[];
  affected_components: readonly string[];
  preventative_recommendations: readonly string[];
  mitigation_options: readonly string[];
  operator_required: boolean;
  supporting_evidence: readonly ForecastEvidence[];
  historical_correlations: readonly HistoricalCorrelation[];
  assumptions: readonly string[];
  constraints: readonly string[];
  governance_validation: "PASS" | "FAIL";
  constitutional_validation: "PASS" | "FAIL";
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  explanation: readonly string[];
  source_historical_intelligence: HistoricalIntelligenceReport;
  advisory_only: true;
  mitigation_executed: boolean;
  execution_modified: boolean;
  governance_modified: boolean;
  policy_bypassed: boolean;
  constitutional_bypassed: boolean;
  cross_tenant_forecast: boolean;
  forecast_hash: string;
}>;

export type RiskForecastRepository = Readonly<{
  repository_id: string;
  tenant_id: string;
  forecast_ids: readonly string[];
  supporting_evidence: readonly string[];
  confidence_projections: readonly number[];
  mitigation_recommendations: readonly string[];
  replay_references: readonly string[];
  lineage_references: readonly string[];
  integrity_hashes: readonly string[];
  append_only: true;
  repository_hash: string;
}>;

export type RiskForecastingReport = Readonly<{
  report_id: string;
  tenant_id: string;
  mission_id: string;
  forecasts: readonly RiskForecastObject[];
  repository: RiskForecastRepository;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  advisory_only: true;
  report_hash: string;
}>;

export type RiskForecastingInput = Readonly<{
  scenario?: RiskForecastScenario;
  forecast_type?: RiskForecastType;
  historical_report?: HistoricalIntelligenceReport;
  tenant_id?: string;
  mission_id?: string;
}>;

export type RiskForecastValidationResult = Readonly<{
  report_id: string | null;
  valid: boolean;
  forecast_contract_valid: boolean;
  forecast_schema_valid: boolean;
  forecasts_deterministic: boolean;
  confidence_reproducible: boolean;
  supporting_evidence_complete: boolean;
  explanations_complete: boolean;
  historical_correlations_reproducible: boolean;
  replay_valid: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  operator_approval_required: boolean;
  advisory_only: boolean;
  tenant_isolated: boolean;
  integrity_valid: boolean;
  immutable_hash_valid: boolean;
  failures: readonly RiskForecastFailure[];
  validation_hash: string;
}>;

export type RiskForecastReplayResult = Readonly<{
  replay_reference: string;
  report_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_result_hash: string;
}>;

export type RiskForecastObservabilitySurface = Readonly<{
  report_id: string;
  forecast_count: number;
  highest_severity: RiskSeverityLevel;
  highest_probability: ForecastProbabilityLevel;
  tenant_id: string;
  advisory_only: true;
  report_hash: string;
}>;

export type RiskForecastingEngineContract = Readonly<{
  doctrine: Readonly<{
    engine_version: "risk-forecasting-engine/v8ALT.3.3";
    principles: readonly string[];
    forecast_types: readonly RiskForecastType[];
    pipeline_states: readonly RiskForecastPipelineState[];
    severity_levels: readonly RiskSeverityLevel[];
    probability_levels: readonly ForecastProbabilityLevel[];
    forecast_windows: readonly ForecastWindow[];
    advisory_only: true;
  }>;
  report: RiskForecastingReport;
  validation: RiskForecastValidationResult;
  replay: RiskForecastReplayResult;
  observability: RiskForecastObservabilitySurface;
}>;
