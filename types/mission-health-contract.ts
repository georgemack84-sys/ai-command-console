export type MissionHealthLifecycleState = "CREATED" | "COLLECTING_SUBSYSTEM_HEALTH" | "AGGREGATING" | "SCORING" | "CONFIDENCE_ESTIMATION" | "TREND_ANALYSIS" | "HEALTH_VALIDATED" | "PUBLISHED" | "ARCHIVED";
export type MissionHealthState = "INITIALIZING" | "COLLECTING" | "CALCULATING" | "VALIDATING" | "HEALTHY" | "STABLE" | "WARNING" | "DEGRADED" | "CRITICAL" | "RECOVERING" | "FAILED" | "ARCHIVED";
export type MissionHealthClassification = "OPTIMAL" | "HEALTHY" | "STABLE" | "WARNING" | "DEGRADED" | "CRITICAL" | "FAILED";
export type MissionConfidenceLevel = "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" | "VERY_LOW" | "INSUFFICIENT";
export type MissionTrendState = "IMPROVING" | "STABLE" | "FLUCTUATING" | "DEGRADING" | "RAPID_DECLINE" | "RECOVERING" | "UNKNOWN";
export type MissionSubsystemId = "planning" | "orchestration" | "delegation" | "runtime_supervision" | "governance" | "replay" | "integrity" | "authority";

export type MissionHealthScenario =
  | "BASELINE"
  | "MISSING_SUBSYSTEM"
  | "DUPLICATE_SUBSYSTEM"
  | "INVALID_HEALTH_SCORE"
  | "INVALID_CONFIDENCE"
  | "INCONSISTENT_AGGREGATION"
  | "MISSING_EVIDENCE"
  | "MISSING_REPLAY_REFERENCE"
  | "BROKEN_LINEAGE"
  | "INTEGRITY_FAILURE"
  | "ADVISORY_ONLY_VIOLATION";

export type MissionHealthFailure =
  | "CONTRACT_VERSION_INVALID"
  | "SCHEMA_INVALID"
  | "SUBSYSTEM_REGISTRATION_INVALID"
  | "REQUIRED_HEALTH_METRICS_MISSING"
  | "SCORING_WEIGHTS_INVALID"
  | "CONFIDENCE_INVALID"
  | "AGGREGATION_INCONSISTENT"
  | "EVIDENCE_INCOMPLETE"
  | "REPLAY_REFERENCE_MISSING"
  | "LINEAGE_BROKEN"
  | "INTEGRITY_INVALID"
  | "GOVERNANCE_INVALID"
  | "CONSTITUTIONAL_INVALID"
  | "TENANT_ISOLATION_INVALID"
  | "ADVISORY_ONLY_VIOLATION";

export type SubsystemRegistryEntry = Readonly<{
  subsystem_id: MissionSubsystemId;
  subsystem_name: string;
  purpose: string;
  weight: number;
  certified: boolean;
}>;

export type HealthEvidence = Readonly<{
  evidence_id: string;
  mission_id: string;
  subsystem: MissionSubsystemId;
  metric: string;
  metric_value: number;
  calculation: string;
  confidence: number;
  timestamp: string;
  source: string;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  evidence_hash: string;
}>;

export type SubsystemHealth = Readonly<{
  subsystem_id: MissionSubsystemId;
  subsystem_name: string;
  health_score: number;
  confidence: number;
  stability: number;
  risk_level: number;
  status: MissionHealthClassification;
  degradation_detected: boolean;
  trend: MissionTrendState;
  evidence: readonly string[];
  last_updated: string;
  lineage_reference: string;
  replay_reference: string;
  subsystem_hash: string;
}>;

export type MissionConfidence = Readonly<{
  overall_confidence: number;
  confidence_level: MissionConfidenceLevel;
  planning_confidence: number;
  orchestration_confidence: number;
  delegation_confidence: number;
  supervision_confidence: number;
  governance_confidence: number;
  replay_confidence: number;
  integrity_confidence: number;
  authority_confidence: number;
  confidence_hash: string;
}>;

export type MissionTrendSummary = Readonly<{
  trend_state: MissionTrendState;
  moving_average: number;
  health_velocity: number;
  degradation_acceleration: number;
  recovery_velocity: number;
  stability_duration: string;
  confidence_evolution: readonly number[];
  trend_hash: string;
}>;

export type MissionHealthTimelineSnapshot = Readonly<{
  timestamp: string;
  mission_health_score: number;
  subsystem_scores: readonly string[];
  confidence: number;
  trend_state: MissionTrendState;
  detected_degradation: boolean;
  recommendations: readonly string[];
  evidence_references: readonly string[];
  replay_references: readonly string[];
  lineage_references: readonly string[];
  snapshot_hash: string;
}>;

export type MissionHealthRecord = Readonly<{
  mission_health_id: string;
  mission_id: string;
  tenant_id: string;
  status: MissionHealthLifecycleState;
  overall_health_score: number;
  overall_confidence: number;
  overall_risk: number;
  overall_stability: number;
  health_state: MissionHealthState;
  health_classification: MissionHealthClassification;
  calculation_timestamp: string;
  subsystem_scores: readonly SubsystemHealth[];
  confidence_model: MissionConfidence;
  trend_summary: MissionTrendSummary;
  timeline_reference: string;
  timeline: readonly MissionHealthTimelineSnapshot[];
  evidence_reference: string;
  evidence: readonly HealthEvidence[];
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  contract_version: "mission-health-contract/v8ALT.4.1";
  advisory_only: true;
  recovery_executed: boolean;
  execution_modified: boolean;
  governance_modified: boolean;
  constitutional_modified: boolean;
  autonomous_execution_approved: boolean;
  record_hash: string;
}>;

export type MissionHealthInput = Readonly<{
  scenario?: MissionHealthScenario;
  tenant_id?: string;
  mission_id?: string;
}>;

export type MissionHealthValidationResult = Readonly<{
  mission_health_id: string | null;
  valid: boolean;
  contract_version_valid: boolean;
  schema_integrity_valid: boolean;
  subsystem_registration_valid: boolean;
  required_health_metrics_present: boolean;
  scoring_weights_valid: boolean;
  confidence_values_valid: boolean;
  aggregation_consistent: boolean;
  evidence_complete: boolean;
  replay_references_present: boolean;
  lineage_references_present: boolean;
  integrity_hashes_valid: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  tenant_isolated: boolean;
  advisory_only_behavior_enforced: boolean;
  failures: readonly MissionHealthFailure[];
  validation_hash: string;
}>;

export type MissionHealthReplayResult = Readonly<{
  replay_reference: string;
  mission_health_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_result_hash: string;
}>;

export type MissionHealthObservabilitySurface = Readonly<{
  mission_health_id: string;
  mission_id: string;
  tenant_id: string;
  health_state: MissionHealthState;
  health_score: number;
  confidence: number;
  subsystem_count: number;
  trend_state: MissionTrendState;
  advisory_only: true;
  record_hash: string;
}>;

export type MissionHealthContract = Readonly<{
  doctrine: Readonly<{
    contract_version: "mission-health-contract/v8ALT.4.1";
    principles: readonly string[];
    lifecycle_states: readonly MissionHealthLifecycleState[];
    health_states: readonly MissionHealthState[];
    confidence_levels: readonly MissionConfidenceLevel[];
    trend_states: readonly MissionTrendState[];
    subsystem_registry: readonly SubsystemRegistryEntry[];
    advisory_only: true;
  }>;
  health: MissionHealthRecord;
  validation: MissionHealthValidationResult;
  replay: MissionHealthReplayResult;
  observability: MissionHealthObservabilitySurface;
}>;
