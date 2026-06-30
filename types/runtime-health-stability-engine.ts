import type { AdaptiveRuntimeHealthLevel, AdaptiveTrend } from "@/types/adaptive-runtime-assurance-contract";
import type { RuntimeConfidenceRecord } from "@/types/runtime-confidence-evaluation-engine";

export type RuntimeHealthComponent = "EXECUTION" | "PLANNING" | "ORCHESTRATION" | "DELEGATION" | "SUPERVISION" | "GOVERNANCE" | "INTEGRITY";
export type RuntimeHealthLifecycleStage = "COLLECT_RUNTIME_DATA" | "VALIDATE_TELEMETRY" | "EVALUATE_SUBSYSTEM_HEALTH" | "CALCULATE_STABILITY" | "ANALYZE_TRENDS" | "DETECT_ANOMALIES" | "GENERATE_EXPLANATION" | "VALIDATE_REPLAY" | "STORE_HEALTH_RECORD" | "PUBLISH_RESULTS";
export type RuntimeHealthScenario = "BASELINE" | "INCOMPLETE_TELEMETRY" | "INVALID_TELEMETRY" | "EXECUTION_INSTABILITY" | "PLANNING_INSTABILITY" | "ORCHESTRATION_INSTABILITY" | "DELEGATION_INSTABILITY" | "SUPERVISION_INSTABILITY" | "CONFIDENCE_OSCILLATION" | "REPEATED_DEGRADATION" | "REPEATED_RECOVERY" | "CHECKPOINT_FAILURES" | "EXCESSIVE_RETRIES" | "EXCESSIVE_ROLLBACKS" | "STALLED_EXECUTION" | "DEPENDENCY_FAILURES" | "SYNCHRONIZATION_FAILURES" | "RECURRING_WORKFLOW_FAILURES" | "REPEATED_PLANNING_FAILURES" | "REPEATED_GOVERNANCE_VIOLATIONS" | "REPEATED_INTEGRITY_FAILURES" | "UNHEALTHY_TREND" | "REPLAY_MISMATCH" | "TENANT_ISOLATION_FAILURE" | "EXECUTION_AUTHORITY_ATTEMPT";
export type RuntimeHealthFailure = "INCOMPLETE_TELEMETRY" | "INVALID_TELEMETRY" | "EXECUTION_INSTABILITY" | "PLANNING_INSTABILITY" | "ORCHESTRATION_INSTABILITY" | "DELEGATION_INSTABILITY" | "SUPERVISION_INSTABILITY" | "CONFIDENCE_OSCILLATION" | "REPEATED_DEGRADATION" | "REPEATED_RECOVERY" | "CHECKPOINT_FAILURES" | "EXCESSIVE_RETRIES" | "EXCESSIVE_ROLLBACKS" | "STALLED_EXECUTION" | "DEPENDENCY_FAILURES" | "SYNCHRONIZATION_FAILURES" | "RECURRING_WORKFLOW_FAILURES" | "REPEATED_PLANNING_FAILURES" | "REPEATED_GOVERNANCE_VIOLATIONS" | "REPEATED_INTEGRITY_FAILURES" | "UNHEALTHY_TREND" | "REPLAY_MISMATCH" | "TENANT_ISOLATION_FAILURE" | "UNAUTHORIZED_EXECUTION_CAPABILITY";
export type RuntimeHealthValidationState = "PASS" | "FAIL";
export type RuntimeOscillationSeverity = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RuntimeStabilityIndicator = Readonly<{
  indicator_id: string;
  component: RuntimeHealthComponent;
  metric: string;
  raw_value: number;
  normalized_value: number;
  stability_score: number;
  evidence_reference: string;
  indicator_hash: string;
}>;

export type RuntimeSubsystemHealth = Readonly<{
  component: RuntimeHealthComponent;
  weight: number;
  health_score: number;
  stability_score: number;
  health_level: AdaptiveRuntimeHealthLevel;
  explanation_reference: string;
  subsystem_hash: string;
}>;

export type RuntimeOscillationReport = Readonly<{
  oscillation_id: string;
  severity: RuntimeOscillationSeverity;
  affected_subsystems: readonly RuntimeHealthComponent[];
  frequency: number;
  duration_ms: number;
  supporting_evidence: readonly string[];
  oscillation_hash: string;
}>;

export type RuntimeHealthExplanation = Readonly<{
  explanation_id: string;
  contributing_metrics: readonly string[];
  subsystem_analysis: readonly RuntimeSubsystemHealth[];
  detected_anomalies: readonly RuntimeHealthFailure[];
  stability_rationale: string;
  trend_interpretation: string;
  governance_influence: readonly string[];
  constitutional_influence: readonly string[];
  supporting_evidence: readonly string[];
  recommended_monitoring_priorities: readonly string[];
  explanation_hash: string;
}>;

export type RuntimeHealthTimelineEntry = Readonly<{
  timeline_id: string;
  health_id: string;
  evaluation_timestamp: string;
  subsystem_health: readonly RuntimeSubsystemHealth[];
  stability_indicators: readonly RuntimeStabilityIndicator[];
  trend_history: AdaptiveTrend;
  degradation_events: readonly RuntimeHealthFailure[];
  recovery_events: readonly string[];
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  append_only: true;
  timeline_hash: string;
}>;

export type RuntimeHealthReplayResult = Readonly<{
  replay_id: string;
  health_id: string;
  deterministic: boolean;
  reconstructed_runtime_health: AdaptiveRuntimeHealthLevel;
  reconstructed_stability_score: number;
  reconstructed_explanation_hash: string;
  reconstructed_timeline_hash: string;
  replay_failures: readonly RuntimeHealthFailure[];
  replay_hash: string;
}>;

export type RuntimeHealthRecord = Readonly<{
  health_id: string;
  tenant_id: string;
  mission_id: string;
  execution_id: string;
  engine_version: "runtime-health-stability-engine/v8ALT.1C";
  evaluation_timestamp: string;
  lifecycle: readonly RuntimeHealthLifecycleStage[];
  overall_runtime_health: number;
  execution_health: number;
  planning_health: number;
  orchestration_health: number;
  delegation_health: number;
  supervision_health: number;
  governance_health: number;
  integrity_health: number;
  stability_score: number;
  health_level: AdaptiveRuntimeHealthLevel;
  stability_indicators: readonly RuntimeStabilityIndicator[];
  subsystem_health: readonly RuntimeSubsystemHealth[];
  oscillation_report: RuntimeOscillationReport;
  detected_instability: readonly RuntimeHealthFailure[];
  detected_oscillation: boolean;
  detected_failures: readonly RuntimeHealthFailure[];
  health_trend: AdaptiveTrend;
  trend_velocity: number;
  health_explanation: RuntimeHealthExplanation;
  timeline: readonly RuntimeHealthTimelineEntry[];
  evidence: readonly string[];
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  advisory_only: true;
  execution_authorized: boolean;
  execution_modified: boolean;
  governance_modified: boolean;
  record_hash: string;
}>;

export type RuntimeHealthInput = Readonly<{
  scenario?: RuntimeHealthScenario;
  confidence?: RuntimeConfidenceRecord;
}>;

export type RuntimeHealthValidationResult = Readonly<{
  health_id: string | null;
  validation_state: RuntimeHealthValidationState;
  valid: boolean;
  telemetry_valid: boolean;
  health_scores_normalized: boolean;
  stability_valid: boolean;
  evidence_complete: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  replay_valid: boolean;
  timeline_append_only: boolean;
  tenant_isolated: boolean;
  advisory_only: boolean;
  failures: readonly RuntimeHealthFailure[];
  validation_hash: string;
}>;

export type RuntimeHealthCertification = Readonly<{
  certification_id: string;
  health_id: string;
  certified: boolean;
  validation: RuntimeHealthValidationResult;
  ready_for_drift_detection_engine: boolean;
  certification_hash: string;
}>;

export type RuntimeHealthPublisherSurface = Readonly<{
  health_id: string;
  overall_runtime_health: number;
  health_level: AdaptiveRuntimeHealthLevel;
  stability_score: number;
  health_trend: AdaptiveTrend;
  trend_velocity: number;
  detected_instability: readonly RuntimeHealthFailure[];
  detected_oscillation: boolean;
  oscillation_severity: RuntimeOscillationSeverity;
  replay_reference: string;
  integrity_hash: string;
  advisory_only: true;
}>;

export type RuntimeHealthStabilityEngineContract = Readonly<{
  doctrine: Readonly<{
    engine_version: "runtime-health-stability-engine/v8ALT.1C";
    principles: readonly string[];
    lifecycle: readonly RuntimeHealthLifecycleStage[];
    components: readonly RuntimeHealthComponent[];
    weights: Readonly<Record<RuntimeHealthComponent, number>>;
    health_levels: readonly AdaptiveRuntimeHealthLevel[];
    advisory_only: true;
  }>;
  health: RuntimeHealthRecord;
  validation: RuntimeHealthValidationResult;
  replay: RuntimeHealthReplayResult;
  certification: RuntimeHealthCertification;
}>;
