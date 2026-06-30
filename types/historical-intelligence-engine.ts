export type HistoricalDataSource =
  | "EXECUTION_HISTORY"
  | "PLANNING_HISTORY"
  | "ORCHESTRATION_HISTORY"
  | "DELEGATION_HISTORY"
  | "SUPERVISION_HISTORY"
  | "RECOVERY_HISTORY"
  | "REPLAY_HISTORY"
  | "INTEGRITY_HISTORY"
  | "GOVERNANCE_HISTORY"
  | "RUNTIME_ASSURANCE_HISTORY"
  | "MISSION_HEALTH_HISTORY"
  | "RESOURCE_TELEMETRY"
  | "DEPENDENCY_GRAPHS"
  | "OPERATOR_INTERVENTIONS"
  | "CERTIFICATION_HISTORY";

export type HistoricalPipelineState = "COLLECT" | "NORMALIZE" | "VALIDATE" | "CLASSIFY" | "TREND_ANALYSIS" | "PATTERN_DETECTION" | "CORRELATION" | "MODEL_GENERATION" | "MODEL_VALIDATION" | "PUBLISHED" | "REJECTED";
export type HistoricalModelType = "EXECUTION_FORECAST" | "GOVERNANCE_FORECAST" | "CONFIDENCE_FORECAST" | "REPLAY_FORECAST" | "INTEGRITY_FORECAST" | "RESOURCE_FORECAST" | "ORCHESTRATION_FORECAST";
export type HistoricalConfidenceState = "STABLE" | "IMPROVING" | "DEGRADING" | "VOLATILE" | "COLLAPSE_RISK";

export type HistoricalIntelligenceScenario =
  | "BASELINE"
  | "MISSING_HISTORICAL_EVIDENCE"
  | "NONDETERMINISTIC_NORMALIZATION"
  | "MISSING_FAILURE_PATTERNS"
  | "RESOURCE_MODEL_MISMATCH"
  | "GOVERNANCE_ANALYSIS_MISSING"
  | "CONFIDENCE_TREND_MISSING"
  | "MODEL_VERSION_MUTATED"
  | "LINEAGE_BROKEN"
  | "REPLAY_MISMATCH"
  | "MISSING_ASSUMPTIONS"
  | "GOVERNANCE_INVALID"
  | "CONSTITUTIONAL_INVALID"
  | "OPERATOR_APPROVAL_MISSING"
  | "AUTONOMOUS_MODEL_MODIFICATION"
  | "UNAUTHORIZED_MODEL_UPDATE"
  | "TENANT_ISOLATION_FAILURE"
  | "CROSS_TENANT_ANALYSIS"
  | "INTEGRITY_FAILURE"
  | "EXPLAINABILITY_INCOMPLETE";

export type HistoricalIntelligenceFailure =
  | "HISTORICAL_DATA_INVALID"
  | "NORMALIZATION_NONDETERMINISTIC"
  | "TREND_ANALYSIS_INVALID"
  | "FAILURE_PATTERNS_MISSING"
  | "RESOURCE_MODEL_INVALID"
  | "GOVERNANCE_ANALYSIS_INVALID"
  | "CONFIDENCE_TREND_INVALID"
  | "MODEL_GENERATION_INVALID"
  | "MODEL_VERSION_MUTATED"
  | "LINEAGE_INVALID"
  | "REPLAY_INVALID"
  | "ASSUMPTIONS_MISSING"
  | "GOVERNANCE_INVALID"
  | "CONSTITUTIONAL_INVALID"
  | "OPERATOR_APPROVAL_MISSING"
  | "AUTONOMOUS_MODEL_MODIFICATION_DETECTED"
  | "UNAUTHORIZED_MODEL_UPDATE_DETECTED"
  | "TENANT_ISOLATION_INVALID"
  | "CROSS_TENANT_ANALYSIS_DETECTED"
  | "INTEGRITY_INVALID"
  | "EXPLAINABILITY_INCOMPLETE";

export type HistoricalEvidenceRecord = Readonly<{
  evidence_id: string;
  source_type: HistoricalDataSource;
  tenant_id: string;
  historical_window: string;
  record_count: number;
  normalized: boolean;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  evidence_hash: string;
}>;

export type HistoricalTrendSummary = Readonly<{
  trend_id: string;
  execution_duration_trend: HistoricalConfidenceState;
  mission_completion_rate: number;
  checkpoint_frequency: number;
  dependency_growth: number;
  orchestration_complexity: number;
  runtime_health_evolution: HistoricalConfidenceState;
  recovery_frequency: number;
  governance_workload: number;
  integrity_verification_trend: HistoricalConfidenceState;
  replay_consistency: number;
  trend_deviations: readonly string[];
  stability_indicator: HistoricalConfidenceState;
  trend_hash: string;
}>;

export type HistoricalFailurePattern = Readonly<{
  signature_id: string;
  failure_type: string;
  recurrence_frequency: number;
  causal_chain: readonly string[];
  contributing_factors: readonly string[];
  historical_impact_score: number;
  pattern_hash: string;
}>;

export type HistoricalResourceProfile = Readonly<{
  profile_id: string;
  cpu_baseline: number;
  memory_baseline: number;
  storage_growth: number;
  network_utilization: number;
  workflow_queue_depth: number;
  agent_utilization: number;
  orchestration_capacity: number;
  concurrent_execution_load: number;
  dependency_expansion: number;
  recovery_resource_demand: number;
  saturation_indicators: readonly string[];
  bottleneck_probability: number;
  profile_hash: string;
}>;

export type HistoricalGovernanceProfile = Readonly<{
  profile_id: string;
  governance_stability_score: number;
  policy_trend_analysis: string;
  escalation_trends: readonly string[];
  approval_timeline_hours: number;
  governance_workload_indicators: readonly string[];
  constitutional_compliance: "PASS" | "FAIL";
  authority_validation: "PASS" | "FAIL";
  operator_approval_required: boolean;
  governance_hash: string;
}>;

export type HistoricalConfidenceProfile = Readonly<{
  profile_id: string;
  planning_confidence: HistoricalConfidenceState;
  execution_confidence: HistoricalConfidenceState;
  supervision_confidence: HistoricalConfidenceState;
  recovery_confidence: HistoricalConfidenceState;
  prediction_confidence: HistoricalConfidenceState;
  replay_confidence: HistoricalConfidenceState;
  integrity_confidence: HistoricalConfidenceState;
  governance_confidence: HistoricalConfidenceState;
  confidence_baseline: number;
  volatility_score: number;
  degradation_forecasts: readonly string[];
  profile_hash: string;
}>;

export type DeterministicPredictionModel = Readonly<{
  model_id: string;
  model_version: "historical-prediction-model/v8ALT.3.2";
  model_type: HistoricalModelType;
  tenant_id: string;
  training_dataset_reference: string;
  historical_window: string;
  trend_summary: string;
  failure_patterns: readonly string[];
  resource_profile: string;
  governance_profile: string;
  confidence_profile: string;
  prediction_logic: string;
  assumptions: readonly string[];
  constraints: readonly string[];
  validation_results: readonly string[];
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  created_at: string;
  approved_by: string;
  explainability: readonly string[];
  model_hash: string;
}>;

export type HistoricalIntelligenceRepository = Readonly<{
  repository_id: string;
  tenant_id: string;
  model_ids: readonly string[];
  trend_summary: string;
  failure_signatures: readonly string[];
  governance_profile: string;
  confidence_profile: string;
  replay_references: readonly string[];
  lineage_references: readonly string[];
  integrity_hashes: readonly string[];
  append_only: true;
  repository_hash: string;
}>;

export type HistoricalIntelligenceReport = Readonly<{
  intelligence_id: string;
  tenant_id: string;
  mission_id: string;
  pipeline_state: HistoricalPipelineState;
  historical_window: string;
  evidence: readonly HistoricalEvidenceRecord[];
  trend_summary: HistoricalTrendSummary;
  failure_patterns: readonly HistoricalFailurePattern[];
  resource_profile: HistoricalResourceProfile;
  governance_profile: HistoricalGovernanceProfile;
  confidence_profile: HistoricalConfidenceProfile;
  prediction_models: readonly DeterministicPredictionModel[];
  repository: HistoricalIntelligenceRepository;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  advisory_only: true;
  autonomous_learning_enabled: boolean;
  runtime_model_modified: boolean;
  unauthorized_model_update: boolean;
  cross_tenant_analysis: boolean;
  report_hash: string;
}>;

export type HistoricalIntelligenceInput = Readonly<{
  scenario?: HistoricalIntelligenceScenario;
  tenant_id?: string;
  mission_id?: string;
}>;

export type HistoricalIntelligenceValidationResult = Readonly<{
  intelligence_id: string | null;
  valid: boolean;
  data_contract_valid: boolean;
  normalized_deterministically: boolean;
  trends_reproducible: boolean;
  failure_patterns_detected: boolean;
  resource_models_reproducible: boolean;
  governance_analysis_valid: boolean;
  confidence_analysis_valid: boolean;
  models_generated_deterministically: boolean;
  model_versions_immutable: boolean;
  lineage_preserved: boolean;
  replay_valid: boolean;
  evidence_complete: boolean;
  assumptions_documented: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  operator_approval_required: boolean;
  tenant_isolated: boolean;
  integrity_valid: boolean;
  explainability_complete: boolean;
  advisory_only: boolean;
  immutable_hash_valid: boolean;
  failures: readonly HistoricalIntelligenceFailure[];
  validation_hash: string;
}>;

export type HistoricalIntelligenceReplayResult = Readonly<{
  replay_reference: string;
  intelligence_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_result_hash: string;
}>;

export type HistoricalIntelligenceObservabilitySurface = Readonly<{
  intelligence_id: string;
  pipeline_state: HistoricalPipelineState;
  evidence_count: number;
  pattern_count: number;
  model_count: number;
  governance_stability_score: number;
  confidence_baseline: number;
  tenant_id: string;
  advisory_only: true;
  report_hash: string;
}>;

export type HistoricalIntelligenceEngineContract = Readonly<{
  doctrine: Readonly<{
    engine_version: "historical-intelligence-engine/v8ALT.3.2";
    principles: readonly string[];
    data_sources: readonly HistoricalDataSource[];
    pipeline_states: readonly HistoricalPipelineState[];
    model_types: readonly HistoricalModelType[];
    advisory_only: true;
    autonomous_learning_allowed: false;
  }>;
  report: HistoricalIntelligenceReport;
  validation: HistoricalIntelligenceValidationResult;
  replay: HistoricalIntelligenceReplayResult;
  observability: HistoricalIntelligenceObservabilitySurface;
}>;
