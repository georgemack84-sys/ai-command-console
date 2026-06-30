import type { AdaptiveTrend } from "@/types/adaptive-runtime-assurance-contract";
import type { RuntimeHealthRecord } from "@/types/runtime-health-stability-engine";

export type DriftDomain = "CONFIDENCE" | "POLICY" | "CONSTITUTIONAL" | "EXECUTION" | "PLANNING" | "ORCHESTRATION" | "DELEGATION" | "SUPERVISION" | "GOVERNANCE";
export type DriftSeverity = "NONE" | "MINIMAL" | "LOW" | "MODERATE" | "HIGH" | "SEVERE" | "CRITICAL";
export type DriftLifecycleStage = "COLLECT_RUNTIME_DATA" | "LOAD_CERTIFIED_BASELINES" | "DETECT_DRIFT" | "CALCULATE_TRENDS" | "MEASURE_VELOCITY" | "DETECT_ANOMALIES" | "GENERATE_FORECASTS" | "GENERATE_EXPLANATIONS" | "VALIDATE_REPLAY" | "STORE_RESULTS" | "PUBLISH_INTELLIGENCE";
export type DriftScenario = "BASELINE" | "RAPID_CONFIDENCE_DEGRADATION" | "LONG_TERM_CONFIDENCE_DECLINE" | "CONFIDENCE_OSCILLATION" | "CONFIDENCE_COLLAPSE" | "POLICY_DRIFT" | "CONSTITUTIONAL_DRIFT" | "AUTHORITY_DRIFT" | "COMPLIANCE_DEGRADATION" | "EXECUTION_DEGRADATION" | "PLANNING_DEGRADATION" | "ORCHESTRATION_DEGRADATION" | "DELEGATION_DEGRADATION" | "SUPERVISION_DEGRADATION" | "RECURRING_INSTABILITY" | "PERSISTENT_DEGRADATION" | "ANOMALY_CLUSTER" | "CASCADING_FAILURES" | "BASELINE_INVALID" | "FORECAST_INVALID" | "REPLAY_MISMATCH" | "TENANT_ISOLATION_FAILURE" | "EXECUTION_AUTHORITY_ATTEMPT";
export type DriftFailure = "RAPID_CONFIDENCE_DEGRADATION" | "LONG_TERM_CONFIDENCE_DECLINE" | "CONFIDENCE_OSCILLATION" | "CONFIDENCE_COLLAPSE" | "POLICY_DRIFT" | "CONSTITUTIONAL_DRIFT" | "AUTHORITY_DRIFT" | "COMPLIANCE_DEGRADATION" | "EXECUTION_DEGRADATION" | "PLANNING_DEGRADATION" | "ORCHESTRATION_DEGRADATION" | "DELEGATION_DEGRADATION" | "SUPERVISION_DEGRADATION" | "RECURRING_INSTABILITY" | "PERSISTENT_DEGRADATION" | "ANOMALY_CLUSTER" | "CASCADING_FAILURES" | "BASELINE_INVALID" | "FORECAST_INVALID" | "REPLAY_MISMATCH" | "TENANT_ISOLATION_FAILURE" | "UNAUTHORIZED_EXECUTION_CAPABILITY";
export type DriftValidationState = "PASS" | "FAIL";

export type CertifiedDriftBaseline = Readonly<{
  baseline_id: string;
  category: DriftDomain | "CONFIDENCE_BASELINE";
  baseline_version: "certified-drift-baseline/v8ALT.1D";
  baseline_score: number;
  immutable: true;
  replay_compatible: boolean;
  integrity_hash: string;
  baseline_hash: string;
}>;

export type DriftForecast = Readonly<{
  forecast_id: string;
  degradation_forecast: string;
  recovery_prediction: string;
  stability_forecast: string;
  predicted_health: number;
  predicted_confidence: number;
  recovery_likelihood: number;
  certification_readiness: boolean;
  forecast_hash: string;
}>;

export type DriftExplanation = Readonly<{
  explanation_id: string;
  affected_subsystem: DriftDomain;
  contributing_factors: readonly DriftFailure[];
  detected_deviations: readonly string[];
  baseline_comparison: string;
  trend_interpretation: string;
  velocity_analysis: string;
  anomaly_rationale: string;
  governance_influence: readonly string[];
  constitutional_influence: readonly string[];
  supporting_evidence: readonly string[];
  explanation_hash: string;
}>;

export type DriftIntelligenceRecord = Readonly<{
  drift_id: string;
  tenant_id: string;
  mission_id: string;
  execution_id: string;
  engine_version: "drift-detection-trend-intelligence-engine/v8ALT.1D";
  evaluation_timestamp: string;
  drift_category: DriftDomain;
  affected_subsystem: DriftDomain;
  baseline_version: "certified-drift-baseline/v8ALT.1D";
  current_state: number;
  baseline_state: number;
  drift_severity: DriftSeverity;
  drift_score: number;
  trend_direction: AdaptiveTrend;
  degradation_velocity: number;
  recovery_velocity: number;
  forecast: DriftForecast;
  predicted_health: number;
  predicted_confidence: number;
  anomaly_detected: boolean;
  drift_explanation: DriftExplanation;
  supporting_evidence: readonly string[];
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  advisory_only: true;
  execution_authorized: boolean;
  execution_modified: boolean;
  governance_modified: boolean;
  record_hash: string;
}>;

export type TrendReport = Readonly<{
  trend_report_id: string;
  mission_id: string;
  evaluation_period: "SHORT_TERM" | "MEDIUM_TERM" | "LONG_TERM";
  subsystem: DriftDomain;
  rolling_average: number;
  health_trend: AdaptiveTrend;
  confidence_trend: AdaptiveTrend;
  stability_trend: AdaptiveTrend;
  forecast: DriftForecast;
  recommendations: readonly string[];
  generated_at: string;
  replay_reference: string;
  trend_hash: string;
}>;

export type DriftDetectionInput = Readonly<{
  scenario?: DriftScenario;
  health?: RuntimeHealthRecord;
}>;

export type DriftReplayResult = Readonly<{
  replay_id: string;
  drift_id: string;
  deterministic: boolean;
  reconstructed_drift_score: number;
  reconstructed_forecast_hash: string;
  reconstructed_explanation_hash: string;
  replay_failures: readonly DriftFailure[];
  replay_hash: string;
}>;

export type DriftValidationResult = Readonly<{
  drift_id: string | null;
  validation_state: DriftValidationState;
  valid: boolean;
  drift_valid: boolean;
  baseline_valid: boolean;
  forecast_valid: boolean;
  evidence_complete: boolean;
  replay_valid: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  tenant_isolated: boolean;
  advisory_only: boolean;
  failures: readonly DriftFailure[];
  validation_hash: string;
}>;

export type DriftCertification = Readonly<{
  certification_id: string;
  drift_id: string;
  certified: boolean;
  validation: DriftValidationResult;
  ready_for_assurance_recommendation_engine: boolean;
  certification_hash: string;
}>;

export type DriftPublisherSurface = Readonly<{
  drift_id: string;
  drift_category: DriftDomain;
  affected_subsystem: DriftDomain;
  drift_severity: DriftSeverity;
  drift_score: number;
  trend_direction: AdaptiveTrend;
  anomaly_detected: boolean;
  predicted_health: number;
  predicted_confidence: number;
  recommendations: readonly string[];
  replay_reference: string;
  integrity_hash: string;
  advisory_only: true;
}>;

export type DriftDetectionTrendIntelligenceContract = Readonly<{
  doctrine: Readonly<{
    engine_version: "drift-detection-trend-intelligence-engine/v8ALT.1D";
    principles: readonly string[];
    lifecycle: readonly DriftLifecycleStage[];
    domains: readonly DriftDomain[];
    severity_levels: readonly DriftSeverity[];
    advisory_only: true;
  }>;
  baselines: readonly CertifiedDriftBaseline[];
  drift: DriftIntelligenceRecord;
  trends: readonly TrendReport[];
  validation: DriftValidationResult;
  replay: DriftReplayResult;
  certification: DriftCertification;
}>;
