import type { MissionSubsystemId } from "@/types/mission-health-contract";
import type { MissionHealthScore } from "@/types/mission-health-scoring-engine";
import type { MissionTrendState } from "@/types/mission-trend-intelligence-engine";

export type MissionHealthTimelineState = "INITIALIZED" | "RECORDING" | "VALIDATING" | "LINKING_EVIDENCE" | "HASHING" | "COMMITTED" | "REPLAY_AVAILABLE" | "ARCHIVED" | "REJECTED";
export type TimelineEventType = "HEALTH_UPDATE" | "SCORE_CHANGE" | "TREND_CHANGE" | "CONFIDENCE_CHANGE" | "DEGRADATION_EVENT" | "RECOVERY_EVENT" | "OPERATOR_EVENT" | "CERTIFICATION_EVENT" | "GOVERNANCE_EVENT" | "AUDIT_EVENT";
export type OperatorAcknowledgementType = "VIEWED" | "ACKNOWLEDGED" | "ESCALATED" | "REVIEW_REQUESTED" | "MONITORING_CONTINUES" | "NO_ACTION_REQUIRED";
export type DegradationTimelineEventType = "HEALTH_DECLINE" | "CONFIDENCE_DROP" | "STABILITY_LOSS" | "REPLAY_DEGRADATION" | "INTEGRITY_WARNING" | "AUTHORITY_VIOLATION" | "GOVERNANCE_VIOLATION" | "RECOVERY_STARTED" | "RECOVERY_COMPLETED" | "MISSION_FAILURE";
export type TimelineVerificationStatus = "VERIFIED" | "FAILED" | "PENDING";
export type TimelineConfidenceLevel = "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" | "VERY_LOW" | "INSUFFICIENT";

export type MissionHealthTimelineScenario =
  | "BASELINE"
  | "DUPLICATE_ENTRY"
  | "INVALID_SCORE"
  | "INVALID_CONFIDENCE"
  | "BROKEN_LINEAGE"
  | "MISSING_EVIDENCE"
  | "MISSING_REPLAY_REFERENCE"
  | "HASH_MISMATCH"
  | "TIMESTAMP_INCONSISTENCY"
  | "REORDER_ATTEMPT"
  | "DELETE_ATTEMPT"
  | "HISTORY_MUTATION_ATTEMPT"
  | "GOVERNANCE_VIOLATION"
  | "AUTHORITY_VIOLATION"
  | "TENANT_VIOLATION"
  | "AUTONOMOUS_EXECUTION_ATTEMPT";

export type MissionHealthTimelineFailure =
  | "TIMELINE_CONTRACT_INVALID"
  | "DUPLICATE_ENTRY_DETECTED"
  | "SCORE_INVALID"
  | "CONFIDENCE_INVALID"
  | "LINEAGE_BROKEN"
  | "EVIDENCE_MISSING"
  | "REPLAY_REFERENCE_MISSING"
  | "HASH_CHAIN_INVALID"
  | "TIMESTAMP_INCONSISTENT"
  | "TIMELINE_ORDER_INVALID"
  | "DELETE_ATTEMPT_DETECTED"
  | "IMMUTABLE_HISTORY_VIOLATION"
  | "GOVERNANCE_INVALID"
  | "CONSTITUTIONAL_INVALID"
  | "AUTHORITY_INVALID"
  | "TENANT_ISOLATION_INVALID"
  | "ADVISORY_ONLY_VIOLATION";

export type SubsystemHealthSnapshot = Readonly<Record<MissionSubsystemId, Readonly<{
  health_score: number;
  confidence: number;
  stability: number;
  status: string;
  degradation_state: string;
  evidence_reference: string;
}>>>;

export type OperatorAcknowledgement = Readonly<{
  acknowledgement_id: string;
  operator_id: string;
  acknowledgement_type: OperatorAcknowledgementType;
  timestamp: string;
  associated_health_event: string;
  notes: string;
  replay_reference: string;
  acknowledgement_hash: string;
}>;

export type DegradationTimelineEvent = Readonly<{
  event_id: string;
  event_type: DegradationTimelineEventType;
  severity: string;
  affected_subsystem: MissionSubsystemId | "mission";
  evidence_reference: string;
  timestamp: string;
  replay_reference: string;
  operator_visible: true;
  event_hash: string;
}>;

export type MissionHealthTimelineEntry = Readonly<{
  entry_id: string;
  timeline_id: string;
  sequence: number;
  previous_hash: string;
  mission_health_score_id: string;
  mission_id: string;
  tenant_id: string;
  timestamp: string;
  health_state: string;
  overall_health_score: number;
  overall_confidence: number;
  readiness_score: number;
  stability_index: string;
  trend_state: MissionTrendState;
  degradation_state: string;
  subsystem_snapshot: SubsystemHealthSnapshot;
  operator_acknowledgement: OperatorAcknowledgement | null;
  degradation_event: DegradationTimelineEvent | null;
  event_type: TimelineEventType;
  event_reference: string;
  evidence_reference: string;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  verification_status: TimelineVerificationStatus;
  source_score: MissionHealthScore;
  entry_hash: string;
  timeline_hash: string;
}>;

export type MissionHealthTimeline = Readonly<{
  timeline_id: string;
  mission_id: string;
  tenant_id: string;
  timeline_version: "mission-health-timeline/v8ALT.4.5";
  timeline_state: MissionHealthTimelineState;
  entry_count: number;
  first_entry: string;
  latest_entry: string;
  timeline_start: string;
  timeline_end: string;
  entries: readonly MissionHealthTimelineEntry[];
  score_history: readonly number[];
  trend_history: readonly MissionTrendState[];
  confidence_history: readonly number[];
  degradation_events: readonly DegradationTimelineEvent[];
  operator_acknowledgements: readonly OperatorAcknowledgement[];
  integrity_hash: string;
  lineage_reference: string;
  replay_reference: string;
  contract_version: "mission-health-timeline-engine/v8ALT.4.5";
  append_only: true;
  read_only_after_recording: true;
  advisory_only: true;
  historical_entry_modified: boolean;
  entry_deleted: boolean;
  entry_reordered: boolean;
  autonomous_execution_authorized: boolean;
  governance_bypassed: boolean;
  authority_overridden: boolean;
  timeline_hash: string;
}>;

export type MissionHealthTimelineInput = Readonly<{
  scenario?: MissionHealthTimelineScenario;
  mission_id?: string;
  tenant_id?: string;
  scores?: readonly MissionHealthScore[];
}>;

export type MissionHealthTimelineValidationResult = Readonly<{
  timeline_id: string | null;
  valid: boolean;
  timeline_contract_valid: boolean;
  unique_entries: boolean;
  score_history_valid: boolean;
  confidence_history_valid: boolean;
  deterministic_ordering: boolean;
  timestamp_consistency_valid: boolean;
  evidence_complete: boolean;
  replay_references_present: boolean;
  lineage_continuity_valid: boolean;
  hash_chain_valid: boolean;
  immutable_history_preserved: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  authority_valid: boolean;
  tenant_isolated: boolean;
  advisory_only_behavior_enforced: boolean;
  failures: readonly MissionHealthTimelineFailure[];
  validation_hash: string;
}>;

export type MissionHealthTimelineReplayResult = Readonly<{
  replay_reference: string;
  timeline_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_result_hash: string;
}>;

export type MissionHealthTimelineObservabilitySurface = Readonly<{
  timeline_id: string;
  mission_id: string;
  tenant_id: string;
  timeline_state: MissionHealthTimelineState;
  entry_count: number;
  degradation_event_count: number;
  acknowledgement_count: number;
  latest_entry: string;
  advisory_only: true;
  timeline_hash: string;
}>;

export type MissionHealthTimelineEngineContract = Readonly<{
  doctrine: Readonly<{
    engine_version: "mission-health-timeline-engine/v8ALT.4.5";
    principles: readonly string[];
    timeline_states: readonly MissionHealthTimelineState[];
    event_types: readonly TimelineEventType[];
    acknowledgement_types: readonly OperatorAcknowledgementType[];
    degradation_event_types: readonly DegradationTimelineEventType[];
    confidence_levels: readonly TimelineConfidenceLevel[];
    advisory_only: true;
  }>;
  timeline: MissionHealthTimeline;
  validation: MissionHealthTimelineValidationResult;
  replay: MissionHealthTimelineReplayResult;
  observability: MissionHealthTimelineObservabilitySurface;
}>;
