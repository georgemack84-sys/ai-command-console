import type { RuntimeSupervisionContract } from "@/types/runtime-supervision-contract";

export type RuntimeObservationState = "INITIALIZING" | "OBSERVING" | "COLLECTING" | "VALIDATING" | "CORRELATING" | "MONITORING" | "WARNING" | "DEGRADED" | "RECORDING" | "REPLAYABLE" | "FAILED";

export type RuntimeObservationCategory = "EXECUTION" | "GOVERNANCE" | "CONFIDENCE" | "HEALTH" | "RECOMMENDATION";

export type RuntimeObservationSeverity = "INFORMATIONAL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RuntimeObservationScenario =
  | "BASELINE"
  | "INCOMPLETE_OBSERVATION"
  | "EXECUTION_UNOBSERVABLE"
  | "GOVERNANCE_MISSING"
  | "CONSTITUTION_UNOBSERVABLE"
  | "AUTHORITY_UNAVAILABLE"
  | "CONFIDENCE_MISSING"
  | "HEALTH_MISSING"
  | "RECOMMENDATION_UNAVAILABLE"
  | "EVENT_NOT_GENERATED"
  | "TIMELINE_INCOMPLETE"
  | "EVIDENCE_MISSING"
  | "NONDETERMINISTIC_OBSERVATION"
  | "REPLAY_MISMATCH"
  | "TENANT_VIOLATION"
  | "TRUTH_LEDGER_WRITE_FAILED"
  | "HIDDEN_OBSERVATION_CHANNEL"
  | "HASH_MISMATCH";

export type RuntimeObservationFailureReason =
  | "OBSERVATION_INCOMPLETE"
  | "EXECUTION_PROGRESS_UNOBSERVABLE"
  | "GOVERNANCE_OBSERVATION_MISSING"
  | "CONSTITUTIONAL_OBSERVATION_MISSING"
  | "AUTHORITY_VALIDATION_UNAVAILABLE"
  | "CONFIDENCE_METRICS_MISSING"
  | "HEALTH_METRICS_MISSING"
  | "RECOMMENDATION_VALIDITY_UNAVAILABLE"
  | "SUPERVISION_EVENT_NOT_GENERATED"
  | "MONITORING_TIMELINE_INCOMPLETE"
  | "RUNTIME_EVIDENCE_MISSING"
  | "OBSERVATION_NONDETERMINISTIC"
  | "REPLAY_RECONSTRUCTION_MISMATCH"
  | "TENANT_ISOLATION_VIOLATION"
  | "TRUTH_LEDGER_WRITE_FAILED"
  | "INTEGRITY_HASH_MISMATCH"
  | "HIDDEN_OBSERVATION_CHANNEL_DETECTED";

export type RuntimeObservation = Readonly<{
  observation_id: string;
  supervision_id: string;
  execution_id: string;
  mission_id: string;
  tenant_id: string;
  observation_category: RuntimeObservationCategory;
  observation_type: string;
  observed_state: string;
  previous_state: string;
  current_state: string;
  observation_source: string;
  observation_timestamp: string;
  confidence_score: number;
  health_score: number;
  governance_score: number;
  policy_status: "VALID" | "VIOLATION" | "UNKNOWN";
  constitutional_status: "COMPLIANT" | "VIOLATION" | "UNKNOWN";
  authority_status: "VALID" | "INVALID" | "UNKNOWN";
  recommendation_status: "VALID" | "STALE" | "CONFLICTING" | "UNKNOWN";
  evidence_reference: string;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
}>;

export type SupervisionEvent = Readonly<{
  supervision_event_id: string;
  observation_id: string;
  execution_id: string;
  mission_id: string;
  tenant_id: string;
  event_category: RuntimeObservationCategory;
  severity: RuntimeObservationSeverity;
  observed_condition: string;
  execution_state: string;
  governance_state: string;
  confidence_state: string;
  health_state: string;
  recommended_action: string;
  timestamp: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
}>;

export type MonitoringTimelineRecord = Readonly<{
  timeline_id: string;
  supervision_id: string;
  execution_id: string;
  ordered_events: readonly string[];
  observation_hashes: readonly string[];
  supervision_event_hashes: readonly string[];
  replay_reference: string;
  lineage_reference: string;
  timeline_hash: string;
}>;

export type RuntimeObservationEvidence = Readonly<{
  evidence_id: string;
  observation_id: string;
  execution_id: string;
  mission_id: string;
  tenant_id: string;
  observed_values: readonly string[];
  supporting_events: readonly string[];
  policy_references: readonly string[];
  constitutional_references: readonly string[];
  authority_references: readonly string[];
  confidence_metrics: readonly string[];
  health_metrics: readonly string[];
  recommendation_metrics: readonly string[];
  truth_ledger_reference: string;
  timestamp: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
}>;

export type RuntimeObservationValidationResult = Readonly<{
  validation_id: string;
  package_id: string;
  validation_state: "PASS" | "FAIL";
  failures: readonly RuntimeObservationFailureReason[];
  observation_complete: boolean;
  execution_reference_valid: boolean;
  supervision_reference_valid: boolean;
  tenant_isolated: boolean;
  timestamp_ordered: boolean;
  category_defined: boolean;
  governance_references_present: boolean;
  confidence_metrics_recorded: boolean;
  health_metrics_recorded: boolean;
  recommendation_metrics_recorded: boolean;
  evidence_generated: boolean;
  truth_ledger_written: boolean;
  replay_ready: boolean;
  lineage_complete: boolean;
  integrity_verified: boolean;
  ready_for_runtime_analysis: boolean;
  validation_hash: string;
}>;

export type RuntimeObservationReplayResult = Readonly<{
  replay_id: string;
  package_id: string;
  reconstructed_lifecycle: readonly string[];
  reconstructed_observation_hash: string;
  reconstructed_event_hash: string;
  reconstructed_timeline_hash: string;
  reconstructed_evidence_hash: string;
  validation_state: "PASS" | "FAIL";
  failure_reason: RuntimeObservationFailureReason | null;
  replay_hash: string;
}>;

export type RuntimeObservationPackage = Readonly<{
  package_id: string;
  engine_version: "runtime-observation-engine/v8E.B";
  source_supervision_contract: RuntimeSupervisionContract;
  observation_state: RuntimeObservationState;
  observation: RuntimeObservation;
  supervision_event: SupervisionEvent | null;
  monitoring_timeline: MonitoringTimelineRecord;
  runtime_evidence: RuntimeObservationEvidence;
  validation: RuntimeObservationValidationResult;
  replay: RuntimeObservationReplayResult;
  read_only: true;
  execution_modified: false;
  governance_modified: false;
  authority_modified: false;
  hidden_channels_used: false;
  package_hash: string;
}>;

export type RuntimeObservationDashboardSurface = Readonly<{
  package_id: string;
  observation_id: string;
  execution_id: string;
  observation_state: RuntimeObservationState;
  severity: RuntimeObservationSeverity;
  validation_state: "PASS" | "FAIL";
  failures: readonly RuntimeObservationFailureReason[];
  replay_reference: string;
  lineage_reference: string;
  integrity_status: "VALID" | "INVALID";
}>;

export type RuntimeObservationFramework = Readonly<{
  doctrine: Readonly<{
    principles: readonly string[];
    engine_version: "runtime-observation-engine/v8E.B";
    states: readonly RuntimeObservationState[];
    categories: readonly RuntimeObservationCategory[];
    severities: readonly RuntimeObservationSeverity[];
  }>;
  package: RuntimeObservationPackage;
  dashboard: RuntimeObservationDashboardSurface;
}>;
