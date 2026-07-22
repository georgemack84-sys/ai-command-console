import type { DecisionStateDashboardResult } from "@/types/decision-state-dashboard";
import type { VisibilityRole } from "@/types/decision-observability-contract";

export type DecisionTimelineLifecycleStage =
  | "REGISTERED"
  | "INGESTED"
  | "CONTEXTUALIZED"
  | "PRIORITIZED"
  | "DEPENDENCY_ANALYZED"
  | "CONFLICT_REVIEW"
  | "GOVERNANCE_VALIDATED"
  | "PACKAGE_GENERATED"
  | "OPERATOR_REVIEW"
  | "APPROVED"
  | "REPLAY_VALIDATED"
  | "CERTIFIED"
  | "ARCHIVED";

export type DecisionTimelineEventType =
  | "DECISION_CREATED"
  | "DECISION_UPDATED"
  | "RECOMMENDATION_CHANGED"
  | "PRIORITY_CHANGED"
  | "GOVERNANCE_VALIDATION"
  | "CONSTITUTIONAL_VALIDATION"
  | "AUTHORITY_VERIFICATION"
  | "APPROVAL_COMPLETED"
  | "CONFLICT_DETECTED"
  | "ARBITRATION_INITIATED"
  | "ARBITRATION_RESOLVED"
  | "REVIEW_STARTED"
  | "APPROVAL"
  | "REJECTION"
  | "OVERRIDE"
  | "DEFER"
  | "ESCALATION"
  | "EVIDENCE_REQUESTED"
  | "SIMULATION_REQUESTED"
  | "REPLAY_GENERATED"
  | "REPLAY_VERIFIED"
  | "REPLAY_DIVERGENCE_DETECTED"
  | "CERTIFICATION_INITIATED"
  | "CERTIFICATION_COMPLETED"
  | "CERTIFICATION_FAILED"
  | "ARCHIVAL_COMPLETED";

export type TimelineActorType = "SYSTEM" | "OPERATOR" | "GOVERNANCE" | "AUDITOR" | "CERTIFICATION";

export type DecisionTimelineFailure =
  | "TIMELINE_EVENTS_MISSING"
  | "LIFECYCLE_ORDERING_INCORRECT"
  | "TIMESTAMP_INCONSISTENT"
  | "GOVERNANCE_EVENTS_OMITTED"
  | "OPERATOR_ACTIONS_ABSENT"
  | "REPLAY_CHECKPOINTS_MISSING"
  | "CERTIFICATION_MILESTONES_INCOMPLETE"
  | "NONDETERMINISTIC_EVENT_ORDERING"
  | "CROSS_TENANT_TIMELINE_VISIBLE"
  | "INTEGRITY_HASH_MISMATCH"
  | "TIMELINE_REPLAY_RECONSTRUCTION_FAILED"
  | "AUTHORIZATION_FAILURE"
  | "LEDGER_IMMUTABILITY_FAILURE";

export type TimelineEventRecord = Readonly<{
  timeline_event_id: string;
  orchestration_id: string;
  decision_id: string;
  tenant_id: string;
  mission_id: string;
  event_type: DecisionTimelineEventType;
  lifecycle_stage: DecisionTimelineLifecycleStage;
  event_timestamp: string;
  sequence_number: number;
  actor_type: TimelineActorType;
  actor_id: string;
  governance_state: string;
  constitutional_state: string;
  authority_state: string;
  replay_reference: string;
  certification_reference: string;
  evidence_refs: readonly string[];
  dependency_refs: readonly string[];
  duration_ms: number;
  integrity_hash: string;
}>;

export type TimelineLedgerEntry = Readonly<{
  ledger_entry_id: string;
  timeline_event_id: string;
  sequence_number: number;
  event_hash: string;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type TimelineVisualizationModel = Readonly<{
  visualization_id: string;
  view_type: "CHRONOLOGICAL" | "LIFECYCLE" | "GOVERNANCE" | "OPERATOR" | "REPLAY" | "CERTIFICATION" | "DEPENDENCY";
  event_refs: readonly string[];
  grouping_key: string;
  deterministic_sort: readonly string[];
  replay_reference: string;
  integrity_hash: string;
}>;

export type DecisionTimelineMetrics = Readonly<{
  average_lifecycle_duration_ms: number;
  transition_latency_ms: number;
  stage_duration_ms: number;
  completion_rate: number;
  governance_review_duration_ms: number;
  approval_latency_ms: number;
  escalation_frequency: number;
  approval_count: number;
  override_frequency: number;
  response_time_ms: number;
  review_backlog: number;
  replay_generation_time_ms: number;
  replay_success_rate: number;
  divergence_rate: number;
  certification_duration_ms: number;
  validation_failures: number;
  readiness_score: number;
  integrity_hash: string;
}>;

export type DecisionTimelineValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  timeline_generation_deterministic: boolean;
  event_ordering_reproducible: boolean;
  timestamp_consistency_verified: boolean;
  dependency_ordering_validated: boolean;
  lifecycle_complete: boolean;
  governance_checkpoints_complete: boolean;
  operator_actions_complete: boolean;
  replay_reconstructed_identically: boolean;
  ledger_references_valid: boolean;
  tenant_isolated: boolean;
  authorization_valid: boolean;
  integrity_verified: boolean;
  failures: readonly DecisionTimelineFailure[];
  integrity_hash: string;
}>;

export type DecisionTimelineInput = Readonly<{
  dashboard_result?: DecisionStateDashboardResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "MISSING_EVENTS"
    | "BAD_LIFECYCLE_ORDER"
    | "BAD_TIMESTAMP"
    | "MISSING_GOVERNANCE"
    | "MISSING_OPERATOR"
    | "MISSING_REPLAY"
    | "MISSING_CERTIFICATION"
    | "NONDETERMINISTIC_ORDER"
    | "CROSS_TENANT"
    | "HASH_MISMATCH"
    | "REPLAY_RECONSTRUCTION_FAILURE"
    | "UNAUTHORIZED_ROLE"
    | "LEDGER_MUTATION";
}>;

export type DecisionTimelineResult = Readonly<{
  timeline_version: "decision-timeline-visualization/v1";
  dashboard_result: DecisionStateDashboardResult;
  events: readonly TimelineEventRecord[];
  timeline_ledger: readonly TimelineLedgerEntry[];
  chronological_view: TimelineVisualizationModel;
  lifecycle_view: TimelineVisualizationModel;
  governance_view: TimelineVisualizationModel;
  operator_view: TimelineVisualizationModel;
  replay_view: TimelineVisualizationModel;
  certification_view: TimelineVisualizationModel;
  dependency_view: TimelineVisualizationModel;
  metrics: DecisionTimelineMetrics;
  validation: DecisionTimelineValidation;
  deterministic: true;
  advisory_only: true;
  mutates_orchestration: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type DecisionTimelineFoundation = Readonly<{
  timeline_version: "decision-timeline-visualization/v1";
  lifecycle_stages: readonly DecisionTimelineLifecycleStage[];
  event_types: readonly DecisionTimelineEventType[];
  result: DecisionTimelineResult;
}>;
