import type { MissionSubsystemId } from "@/types/mission-health-contract";
import type { MissionHealthScore } from "@/types/mission-health-scoring-engine";

export type MissionTrendState = "IMPROVING" | "STABLE" | "FLUCTUATING" | "OSCILLATING" | "DEGRADING" | "RAPID_DECLINE" | "RECOVERING" | "LONG_TERM_DEGRADATION" | "UNKNOWN";
export type MissionTrendProcessingState = "HEALTH_HISTORY_RECEIVED" | "TIMELINE_VALIDATION" | "TREND_ANALYSIS" | "DRIFT_ANALYSIS" | "DEGRADATION_ANALYSIS" | "RECOVERY_ANALYSIS" | "FORECAST_GENERATION" | "TREND_PUBLICATION" | "REJECTED";
export type MissionTrendWindow = "REALTIME" | "HOURLY" | "DAILY" | "WEEKLY" | "MISSION_LIFECYCLE";
export type MissionOscillationClass = "LOW_OSCILLATION" | "MODERATE_OSCILLATION" | "HIGH_OSCILLATION" | "UNSTABLE";
export type SubsystemDriftCategory = "NO_DRIFT" | "MINOR_DRIFT" | "MODERATE_DRIFT" | "MAJOR_DRIFT" | "CRITICAL_DRIFT";
export type DegradationVelocitySeverity = "NONE" | "SLOW" | "MODERATE" | "FAST" | "CRITICAL";
export type RecoveryTrendState = "RECOVERING" | "RECOVERING_SLOWLY" | "RECOVERING_RAPIDLY" | "RECOVERY_STALLED" | "NO_RECOVERY";

export type MissionTrendScenario =
  | "BASELINE"
  | "IMPROVING"
  | "DEGRADING"
  | "OSCILLATING"
  | "LONG_TERM_DEGRADATION"
  | "RECOVERING"
  | "INCOMPLETE_HISTORY"
  | "NONDETERMINISTIC_ORDER"
  | "MISSING_EVIDENCE"
  | "REPLAY_MISMATCH"
  | "BROKEN_LINEAGE"
  | "INTEGRITY_FAILURE"
  | "GOVERNANCE_FAILURE"
  | "AUTHORITY_VIOLATION"
  | "TENANT_VIOLATION"
  | "ADVISORY_ONLY_VIOLATION";

export type MissionTrendFailure =
  | "TREND_CONTRACT_INVALID"
  | "HEALTH_HISTORY_INCOMPLETE"
  | "TIMELINE_ORDER_INVALID"
  | "TREND_NONDETERMINISTIC"
  | "DRIFT_NONDETERMINISTIC"
  | "FORECAST_NONDETERMINISTIC"
  | "EVIDENCE_INCOMPLETE"
  | "REPLAY_REFERENCE_MISSING"
  | "LINEAGE_BROKEN"
  | "INTEGRITY_INVALID"
  | "GOVERNANCE_INVALID"
  | "CONSTITUTIONAL_INVALID"
  | "AUTHORITY_INVALID"
  | "TENANT_ISOLATION_INVALID"
  | "IMMUTABLE_HISTORY_VIOLATION"
  | "ADVISORY_ONLY_VIOLATION";

export type MissionHealthTimelineEntry = Readonly<{
  entry_id: string;
  sequence: number;
  timestamp: string;
  mission_health_score: MissionHealthScore;
  observed_health_score: number;
  readiness_score: number;
  stability_score: number;
  confidence: number;
  degradation_index: number;
  subsystem_scores: Readonly<Record<MissionSubsystemId, number>>;
  evidence_reference: string;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  entry_hash: string;
}>;

export type MissionHealthTimeline = Readonly<{
  timeline_id: string;
  mission_id: string;
  tenant_id: string;
  time_window: MissionTrendWindow;
  entries: readonly MissionHealthTimelineEntry[];
  evidence_reference: string;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  timeline_hash: string;
}>;

export type MissionMovingAverages = Readonly<{
  health: number;
  confidence: number;
  readiness: number;
  stability: number;
  degradation: number;
  subsystem_health: Readonly<Record<MissionSubsystemId, number>>;
  moving_average_hash: string;
}>;

export type MissionDegradationVelocity = Readonly<{
  current_velocity: number;
  average_velocity: number;
  acceleration: number;
  severity: DegradationVelocitySeverity;
  affected_subsystems: readonly MissionSubsystemId[];
  confidence: number;
  velocity_hash: string;
}>;

export type MissionRecoveryTrend = Readonly<{
  recovery_state: RecoveryTrendState;
  recovery_velocity: number;
  confidence_recovery: number;
  stability_restoration: number;
  readiness_restoration: number;
  affected_subsystems: readonly MissionSubsystemId[];
  recovery_hash: string;
}>;

export type SubsystemDriftAnalysis = Readonly<{
  subsystem: MissionSubsystemId;
  drift_category: SubsystemDriftCategory;
  historical_deviation: number;
  baseline_comparison: number;
  confidence_change: number;
  operational_impact: number;
  drift_hash: string;
}>;

export type MissionHealthForecast = Readonly<{
  forecast_id: string;
  horizon: MissionTrendWindow;
  expected_mission_health: number;
  readiness_projection: number;
  degradation_likelihood: number;
  recovery_likelihood: number;
  confidence_projection: number;
  subsystem_trajectory: Readonly<Record<MissionSubsystemId, number>>;
  advisory_only: true;
  forecast_hash: string;
}>;

export type MissionTrendEvidence = Readonly<{
  evidence_id: string;
  trend_id: string;
  metric: string;
  historical_values: readonly number[];
  calculated_trend: MissionTrendState;
  confidence: number;
  supporting_health_records: readonly string[];
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  evidence_hash: string;
}>;

export type MissionTrend = Readonly<{
  trend_id: string;
  mission_id: string;
  tenant_id: string;
  trend_state: MissionTrendState;
  processing_state: MissionTrendProcessingState;
  trend_strength: number;
  trend_duration: string;
  trend_confidence: number;
  moving_average: MissionMovingAverages;
  degradation_velocity: MissionDegradationVelocity;
  recovery_velocity: number;
  recovery_trend: MissionRecoveryTrend;
  oscillation_class: MissionOscillationClass;
  oscillation_frequency: number;
  oscillation_amplitude: number;
  recurrence_frequency: number;
  subsystem_drift: readonly SubsystemDriftAnalysis[];
  forecast: readonly MissionHealthForecast[];
  time_window: MissionTrendWindow;
  timeline: MissionHealthTimeline;
  analysis_timestamp: string;
  evidence: readonly MissionTrendEvidence[];
  evidence_reference: string;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  contract_version: "mission-trend-intelligence-engine/v8ALT.4.4";
  advisory_only: true;
  autonomous_intervention_initiated: boolean;
  mission_state_modified: boolean;
  subsystem_health_modified: boolean;
  governance_policy_modified: boolean;
  authority_escalated: boolean;
  recovery_authorized: boolean;
  historical_records_modified: boolean;
  trend_hash: string;
}>;

export type MissionTrendInput = Readonly<{
  scenario?: MissionTrendScenario;
  mission_id?: string;
  tenant_id?: string;
  time_window?: MissionTrendWindow;
  timeline?: MissionHealthTimeline;
  history?: readonly MissionHealthTimelineEntry[];
}>;

export type MissionTrendValidationResult = Readonly<{
  trend_id: string | null;
  valid: boolean;
  trend_contract_valid: boolean;
  complete_health_history: boolean;
  deterministic_ordering: boolean;
  trend_reproducible: boolean;
  drift_reproducible: boolean;
  forecast_reproducible: boolean;
  evidence_complete: boolean;
  replay_references_present: boolean;
  lineage_continuity_valid: boolean;
  integrity_hashes_valid: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  authority_valid: boolean;
  tenant_isolated: boolean;
  immutable_history_preserved: boolean;
  advisory_only_behavior_enforced: boolean;
  failures: readonly MissionTrendFailure[];
  validation_hash: string;
}>;

export type MissionTrendReplayResult = Readonly<{
  replay_reference: string;
  trend_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_result_hash: string;
}>;

export type MissionTrendObservabilitySurface = Readonly<{
  trend_id: string;
  mission_id: string;
  tenant_id: string;
  trend_state: MissionTrendState;
  trend_strength: number;
  degradation_velocity: number;
  recovery_velocity: number;
  drift_count: number;
  forecast_count: number;
  advisory_only: true;
  trend_hash: string;
}>;

export type MissionTrendIntelligenceEngineContract = Readonly<{
  doctrine: Readonly<{
    engine_version: "mission-trend-intelligence-engine/v8ALT.4.4";
    principles: readonly string[];
    processing_states: readonly MissionTrendProcessingState[];
    trend_states: readonly MissionTrendState[];
    supported_windows: readonly MissionTrendWindow[];
    oscillation_classes: readonly MissionOscillationClass[];
    drift_categories: readonly SubsystemDriftCategory[];
    degradation_velocity_categories: readonly DegradationVelocitySeverity[];
    recovery_states: readonly RecoveryTrendState[];
    advisory_only: true;
  }>;
  trend: MissionTrend;
  validation: MissionTrendValidationResult;
  replay: MissionTrendReplayResult;
  observability: MissionTrendObservabilitySurface;
}>;
