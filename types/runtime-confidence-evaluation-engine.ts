import type {
  AdaptiveAssuranceConfidenceLevel,
  AdaptiveMonitoringSubsystem,
  AdaptiveRuntimeAssuranceRecord,
  AdaptiveTrend,
} from "@/types/adaptive-runtime-assurance-contract";

export type RuntimeConfidenceComponent = "EXECUTION" | "PLANNING" | "ORCHESTRATION" | "DELEGATION" | "SUPERVISION" | "GOVERNANCE" | "CONSTITUTIONAL";
export type RuntimeConfidenceLifecycleStage = "COLLECT_TELEMETRY" | "VALIDATE_INPUTS" | "CALCULATE_SUBSYSTEM_CONFIDENCE" | "NORMALIZE_SCORES" | "WEIGHTED_AGGREGATION" | "GENERATE_EXPLANATION" | "VALIDATE_REPLAY" | "STORE_RESULTS" | "PUBLISH_CONFIDENCE";
export type RuntimeConfidenceScenario = "BASELINE" | "MISSING_TELEMETRY" | "CORRUPTED_OBSERVATION" | "INVALID_CONFIDENCE_VALUE" | "STALE_RUNTIME_DATA" | "RAPID_DEGRADATION" | "CONFIDENCE_OSCILLATION" | "UNSTABLE_SCORING" | "INCONSISTENT_WEIGHTING" | "MISSING_EVIDENCE" | "GOVERNANCE_UNCERTAINTY" | "CONSTITUTIONAL_UNCERTAINTY" | "REPLAY_DIVERGENCE" | "TENANT_ISOLATION_FAILURE" | "EXECUTION_AUTHORITY_ATTEMPT";
export type RuntimeConfidenceFailure = "MISSING_TELEMETRY" | "CORRUPTED_OBSERVATION" | "INVALID_CONFIDENCE_VALUE" | "STALE_RUNTIME_DATA" | "RAPID_CONFIDENCE_DEGRADATION" | "CONFIDENCE_OSCILLATION" | "UNSTABLE_SCORING" | "INCONSISTENT_WEIGHTING" | "MISSING_EVIDENCE" | "GOVERNANCE_UNCERTAINTY" | "CONSTITUTIONAL_UNCERTAINTY" | "REPLAY_DIVERGENCE" | "TENANT_ISOLATION_FAILURE" | "UNAUTHORIZED_EXECUTION_CAPABILITY";
export type RuntimeConfidenceValidationState = "PASS" | "FAIL";

export type RuntimeConfidenceFactor = Readonly<{
  factor_id: string;
  component: RuntimeConfidenceComponent;
  name: string;
  raw_value: number;
  normalized_value: number;
  evidence_reference: string;
  factor_hash: string;
}>;

export type RuntimeConfidenceWeightedScore = Readonly<{
  component: RuntimeConfidenceComponent;
  weight: number;
  score: number;
  weighted_score: number;
  confidence_level: AdaptiveAssuranceConfidenceLevel;
  explanation_reference: string;
  score_hash: string;
}>;

export type RuntimeConfidenceExplanation = Readonly<{
  explanation_id: string;
  contributing_factors: readonly string[];
  supporting_evidence: readonly string[];
  subsystem_scores: readonly RuntimeConfidenceWeightedScore[];
  weighting_rationale: string;
  detected_risks: readonly RuntimeConfidenceFailure[];
  governance_influences: readonly string[];
  constitutional_influences: readonly string[];
  historical_comparison: string;
  trend_interpretation: string;
  explanation_hash: string;
}>;

export type RuntimeConfidenceHistoryEntry = Readonly<{
  history_id: string;
  confidence_id: string;
  evaluation_timestamp: string;
  overall_confidence: number;
  subsystem_confidence: readonly RuntimeConfidenceWeightedScore[];
  trend_snapshot: AdaptiveTrend;
  evidence_references: readonly string[];
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  append_only: true;
  history_hash: string;
}>;

export type RuntimeConfidenceReplayResult = Readonly<{
  replay_id: string;
  confidence_id: string;
  deterministic: boolean;
  reconstructed_overall_confidence: number;
  reconstructed_explanation_hash: string;
  reconstructed_integrity_hash: string;
  replay_failures: readonly RuntimeConfidenceFailure[];
  replay_hash: string;
}>;

export type RuntimeConfidenceRecord = Readonly<{
  confidence_id: string;
  tenant_id: string;
  mission_id: string;
  execution_id: string;
  engine_version: "runtime-confidence-evaluation-engine/v8ALT.1B";
  evaluation_timestamp: string;
  lifecycle: readonly RuntimeConfidenceLifecycleStage[];
  overall_confidence: number;
  execution_confidence: number;
  planning_confidence: number;
  orchestration_confidence: number;
  delegation_confidence: number;
  supervision_confidence: number;
  governance_confidence: number;
  constitutional_confidence: number;
  confidence_level: AdaptiveAssuranceConfidenceLevel;
  trend: AdaptiveTrend;
  trend_velocity: number;
  degradation_detected: boolean;
  recovery_detected: boolean;
  confidence_factors: readonly RuntimeConfidenceFactor[];
  weighted_scores: readonly RuntimeConfidenceWeightedScore[];
  confidence_explanation: RuntimeConfidenceExplanation;
  evidence: readonly string[];
  history: readonly RuntimeConfidenceHistoryEntry[];
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  advisory_only: true;
  execution_authorized: boolean;
  execution_modified: boolean;
  governance_modified: boolean;
  record_hash: string;
}>;

export type RuntimeConfidenceInput = Readonly<{
  scenario?: RuntimeConfidenceScenario;
  assurance?: AdaptiveRuntimeAssuranceRecord;
}>;

export type RuntimeConfidenceValidationResult = Readonly<{
  confidence_id: string | null;
  validation_state: RuntimeConfidenceValidationState;
  valid: boolean;
  inputs_valid: boolean;
  scores_normalized: boolean;
  weights_valid: boolean;
  evidence_complete: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  replay_valid: boolean;
  tenant_isolated: boolean;
  advisory_only: boolean;
  failures: readonly RuntimeConfidenceFailure[];
  validation_hash: string;
}>;

export type RuntimeConfidenceCertification = Readonly<{
  certification_id: string;
  confidence_id: string;
  certified: boolean;
  validation: RuntimeConfidenceValidationResult;
  ready_for_runtime_health_engine: boolean;
  certification_hash: string;
}>;

export type RuntimeConfidenceEngineContract = Readonly<{
  doctrine: Readonly<{
    engine_version: "runtime-confidence-evaluation-engine/v8ALT.1B";
    principles: readonly string[];
    lifecycle: readonly RuntimeConfidenceLifecycleStage[];
    components: readonly RuntimeConfidenceComponent[];
    weights: Readonly<Record<RuntimeConfidenceComponent, number>>;
    advisory_only: true;
  }>;
  confidence: RuntimeConfidenceRecord;
  validation: RuntimeConfidenceValidationResult;
  replay: RuntimeConfidenceReplayResult;
  certification: RuntimeConfidenceCertification;
}>;

export type RuntimeConfidencePublisherSurface = Readonly<{
  confidence_id: string;
  overall_confidence: number;
  confidence_level: AdaptiveAssuranceConfidenceLevel;
  trend: AdaptiveTrend;
  trend_velocity: number;
  degradation_detected: boolean;
  recovery_detected: boolean;
  risks: readonly RuntimeConfidenceFailure[];
  weighted_scores: readonly RuntimeConfidenceWeightedScore[];
  replay_reference: string;
  integrity_hash: string;
  advisory_only: true;
}>;

export type RuntimeConfidenceComponentMap = Readonly<Record<RuntimeConfidenceComponent, AdaptiveMonitoringSubsystem | "CONSTITUTIONAL">>;
