import type { DecisionReplayArtifactRef, DecisionReplayValidationStatus } from "@/types/decision-replay-contract";
import type { ReplaySnapshotCaptureResult, ReplaySnapshotRecord } from "@/types/decision-replay-snapshot-capture";

export type OrchestrationExecutionPhase =
  | "INTAKE"
  | "NORMALIZATION"
  | "CONTEXT_BUILDING"
  | "DEPENDENCY_ANALYSIS"
  | "PRIORITIZATION"
  | "ARBITRATION"
  | "GOVERNANCE_VALIDATION"
  | "PACKAGE_GENERATION"
  | "OPERATOR_WORKFLOW"
  | "FINALIZATION"
  | "COMPLETED";

export type OrchestrationTraceEventType =
  | "INTAKE_TRACE"
  | "NORMALIZATION_TRACE"
  | "CONTEXT_TRACE"
  | "DEPENDENCY_TRACE"
  | "PRIORITY_TRACE"
  | "ARBITRATION_TRACE"
  | "GOVERNANCE_TRACE"
  | "PACKAGE_TRACE"
  | "OPERATOR_TRACE"
  | "FINAL_DECISION_TRACE";

export type OrchestrationTraceState = "CREATED" | "COLLECTING" | "VALIDATED" | "COMMITTED" | "AVAILABLE_FOR_REPLAY" | "CERTIFIED" | "ARCHIVED" | "REJECTED";

export type OrchestrationTraceFailure =
  | "EXECUTION_STAGE_MISSING"
  | "EVENT_ORDERING_INVALID"
  | "DUPLICATE_SEQUENCE"
  | "TRACE_CORRUPTION"
  | "INCOMPLETE_LINEAGE"
  | "INTEGRITY_MISMATCH"
  | "DEPENDENCY_INCONSISTENCY"
  | "REPLAY_REFS_MISSING"
  | "GOVERNANCE_REFS_MISSING"
  | "CONSTITUTIONAL_REFS_MISSING"
  | "UNSUPPORTED_SCHEMA"
  | "LEDGER_COMMIT_FAILURE"
  | "UNKNOWN_EXECUTION_PHASE"
  | "TENANT_MISMATCH"
  | "ORCHESTRATION_MISMATCH";

export type TraceIdentity = Readonly<{
  trace_id: string;
  orchestration_id: string;
  mission_id: string;
  tenant_id: string;
  trace_version: "decision-orchestration-trace/v1";
}>;

export type TraceEvent = Readonly<{
  event_id: string;
  trace_id: string;
  event_type: OrchestrationTraceEventType;
  execution_phase: OrchestrationExecutionPhase;
  sequence_number: number;
  event_timestamp: string;
  parent_event_id: string | null;
  related_event_ids: readonly string[];
  event_payload_ref: string;
  snapshot_ref: string;
  lineage_refs: readonly DecisionReplayArtifactRef[];
  replay_refs: readonly DecisionReplayArtifactRef[];
  governance_refs: readonly DecisionReplayArtifactRef[];
  constitutional_refs: readonly DecisionReplayArtifactRef[];
  integrity_hash: string;
}>;

export type TimelineRecord = Readonly<{
  timeline_id: string;
  trace_id: string;
  ordered_events: readonly string[];
  phase_sequence: readonly OrchestrationExecutionPhase[];
  execution_start: string;
  execution_end: string;
  replay_ready: boolean;
  integrity_hash: string;
}>;

export type DependencyTraceRecord = Readonly<{
  dependency_trace_id: string;
  source_event: string;
  target_event: string;
  dependency_type: "SEQUENTIAL" | "GOVERNANCE" | "OPERATOR" | "CERTIFICATION";
  resolution_status: "SATISFIED" | "BLOCKED";
  lineage_refs: readonly DecisionReplayArtifactRef[];
  integrity_hash: string;
}>;

export type TraceLedgerEntry = Readonly<{
  ledger_entry_id: string;
  trace_id: string;
  event_id: string;
  sequence: number;
  event_integrity_hash: string;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type TraceVisualizationModel = Readonly<{
  mission: string;
  orchestration: string;
  execution_phases: readonly OrchestrationExecutionPhase[];
  events: readonly string[];
  dependencies: readonly string[];
  governance: readonly string[];
  operator_actions: readonly string[];
  outcome: string;
  derived_from_trace: true;
  integrity_hash: string;
}>;

export type OrchestrationTraceValidation = Readonly<{
  validation_id: string;
  trace_id: string;
  validation_status: DecisionReplayValidationStatus;
  event_ordering_valid: boolean;
  sequence_continuity_valid: boolean;
  lineage_complete: boolean;
  dependency_consistency_valid: boolean;
  governance_refs_present: boolean;
  constitutional_refs_present: boolean;
  replay_refs_present: boolean;
  integrity_hashes_reproducible: boolean;
  tenant_ownership_valid: boolean;
  orchestration_ownership_valid: boolean;
  ledger_append_only: boolean;
  replay_ready: boolean;
  failures: readonly OrchestrationTraceFailure[];
  integrity_hash: string;
}>;

export type OrchestrationTraceRecord = Readonly<{
  trace_id: string;
  orchestration_id: string;
  mission_id: string;
  tenant_id: string;
  trace_version: "decision-orchestration-trace/v1";
  schema_version: "decision-orchestration-trace-schema/v1";
  trace_state: OrchestrationTraceState;
  execution_timeline: TimelineRecord;
  trace_events: readonly TraceEvent[];
  dependency_trace: readonly DependencyTraceRecord[];
  lineage_refs: readonly DecisionReplayArtifactRef[];
  replay_refs: readonly DecisionReplayArtifactRef[];
  governance_refs: readonly DecisionReplayArtifactRef[];
  constitutional_refs: readonly DecisionReplayArtifactRef[];
  validation_status: DecisionReplayValidationStatus;
  integrity_hash: string;
}>;

export type OrchestrationTraceBuilderResult = Readonly<{
  trace_version: "decision-orchestration-trace-builder/v1";
  snapshot_capture: ReplaySnapshotCaptureResult;
  trace_identity: TraceIdentity;
  trace_record: OrchestrationTraceRecord;
  ledger: readonly TraceLedgerEntry[];
  visualization: TraceVisualizationModel;
  validation: OrchestrationTraceValidation;
  deterministic: true;
  advisory_only: true;
  mutates_original_orchestration: false;
  integrity_hash: string;
}>;

export type OrchestrationTraceBuilderFoundation = Readonly<{
  trace_version: "decision-orchestration-trace-builder/v1";
  execution_phases: readonly OrchestrationExecutionPhase[];
  event_types: readonly OrchestrationTraceEventType[];
  trace_states: readonly OrchestrationTraceState[];
  terminal_states: readonly OrchestrationTraceState[];
  result: OrchestrationTraceBuilderResult;
}>;

export type TraceEventSource = Readonly<{
  snapshot: ReplaySnapshotRecord;
  event_type: OrchestrationTraceEventType;
  execution_phase: OrchestrationExecutionPhase;
}>;
