import type { ReplayContractPackage } from "@/types/replay-contract";

export type ExecutionReconstructionLifecycleState = "REGISTERED" | "INITIALIZED" | "READY" | "EXECUTING" | "CHECKPOINTING" | "VALIDATING" | "COMPLETED" | "RETRYING" | "PAUSED" | "RECOVERING" | "ROLLBACK_READY" | "ROLLING_BACK" | "ESCALATED" | "TERMINATED" | "FAILED";
export type ExecutionReconstructionOutcome = "VERIFIED" | "PARTIAL" | "MISMATCH" | "INVALID";
export type ExecutionTimelineEventType = "STATE_TRANSITION" | "TASK_STARTED" | "TASK_COMPLETED" | "DEPENDENCY_RESOLVED" | "CHECKPOINT_CREATED" | "CHECKPOINT_VALIDATED" | "ROLLBACK_TRIGGERED" | "ROLLBACK_COMPLETED" | "GOVERNANCE_APPROVED" | "SUPERVISION_OBSERVED" | "EXECUTION_COMPLETED";
export type ExecutionGraphNodeType = "MISSION" | "WORKFLOW" | "STAGE" | "TASK" | "SUBTASK" | "CHECKPOINT" | "ROLLBACK" | "COMPLETION";
export type ExecutionGraphEdgeType = "TRANSITION" | "DEPENDENCY" | "CHECKPOINT" | "ROLLBACK" | "COMPLETION";

export type ExecutionReconstructionScenario =
  | "BASELINE"
  | "MISSING_STATE"
  | "INVALID_TRANSITION"
  | "DEPENDENCY_MISMATCH"
  | "CHECKPOINT_MISMATCH"
  | "EXECUTION_DIVERGENCE"
  | "ROLLBACK_DIVERGENCE"
  | "MISSING_EVIDENCE"
  | "INTEGRITY_VIOLATION"
  | "LINEAGE_BREAK"
  | "GOVERNANCE_FAILURE"
  | "CONSTITUTIONAL_VIOLATION"
  | "TENANT_VIOLATION"
  | "TIMING_MISMATCH"
  | "COMPLETION_INCOMPLETE";

export type ExecutionReconstructionFailure =
  | "MISSING_STATE"
  | "INVALID_TRANSITION"
  | "DEPENDENCY_MISMATCH"
  | "CHECKPOINT_MISMATCH"
  | "EXECUTION_DIVERGENCE"
  | "ROLLBACK_DIVERGENCE"
  | "MISSING_EVIDENCE"
  | "INTEGRITY_VIOLATION"
  | "LINEAGE_BREAK"
  | "GOVERNANCE_APPROVAL_MISSING"
  | "CONSTITUTIONAL_VALIDATION_FAILED"
  | "TENANT_ISOLATION_VIOLATION"
  | "TIMING_MISMATCH"
  | "COMPLETION_INCOMPLETE";

export type ExecutionReconstructionIdentity = Readonly<{
  execution_reconstruction_id: string;
  tenant_id: string;
  mission_id: string;
  workflow_id: string;
  execution_id: string;
  execution_version: "autonomous-execution-reconstruction/v8G.2";
  replay_reference: string;
  timeline_reference: string;
  state_reference: string;
  checkpoint_reference: string;
  rollback_reference: string;
  integrity_reference: string;
  lineage_reference: string;
  created_timestamp: string;
  integrity_hash: string;
}>;

export type ExecutionTimelineEvent = Readonly<{
  event_id: string;
  event_type: ExecutionTimelineEventType;
  sequence: number;
  phase: ExecutionGraphNodeType;
  state: ExecutionReconstructionLifecycleState;
  timestamp: string;
  relative_offset_ms: number;
  causal_parent: string | null;
  artifact_refs: readonly string[];
  governance_reference: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
}>;

export type ExecutionTimeline = Readonly<{
  timeline_id: string;
  execution_id: string;
  workflow_id: string;
  events: readonly ExecutionTimelineEvent[];
  event_order: readonly string[];
  start_timestamp: string;
  completion_timestamp: string | null;
  relative_duration_ms: number;
  timeline_hash: string;
}>;

export type ExecutionGraphNode = Readonly<{
  node_id: string;
  node_type: ExecutionGraphNodeType;
  label: string;
  sequence: number;
  evidence_ref: string;
  integrity_hash: string;
}>;

export type ExecutionGraphEdge = Readonly<{
  edge_id: string;
  edge_type: ExecutionGraphEdgeType;
  from_node: string;
  to_node: string;
  ordering: number;
  evidence_ref: string;
  integrity_hash: string;
}>;

export type ExecutionGraph = Readonly<{
  graph_id: string;
  nodes: readonly ExecutionGraphNode[];
  edges: readonly ExecutionGraphEdge[];
  dependency_edges: readonly string[];
  transition_edges: readonly string[];
  checkpoint_nodes: readonly string[];
  rollback_paths: readonly string[];
  completion_nodes: readonly string[];
  graph_hash: string;
}>;

export type StateReplayEntry = Readonly<{
  state_id: string;
  previous_state: ExecutionReconstructionLifecycleState | null;
  next_state: ExecutionReconstructionLifecycleState | null;
  transition_reason: string;
  execution_timestamp: string;
  integrity_hash: string;
  replay_reference: string;
  governance_reference: string;
}>;

export type DependencyReplayEntry = Readonly<{
  dependency_id: string;
  prerequisite_task: string;
  downstream_task: string;
  activated_at_sequence: number;
  completed_at_sequence: number;
  dependency_completed: boolean;
  dependency_timing_valid: boolean;
  dependency_ordering_valid: boolean;
  replay_deterministic: boolean;
  integrity_hash: string;
}>;

export type CheckpointReplayEntry = Readonly<{
  checkpoint_id: string;
  execution_state: ExecutionReconstructionLifecycleState;
  completed_tasks: readonly string[];
  remaining_tasks: readonly string[];
  dependency_status: "SATISFIED" | "BLOCKED" | "MISMATCH";
  runtime_health: "HEALTHY" | "DEGRADED" | "UNKNOWN";
  governance_status: "VALIDATED" | "MISSING" | "INVALID";
  confidence_score: number;
  timestamp: string;
  integrity_hash: string;
}>;

export type RollbackReplayEntry = Readonly<{
  rollback_id: string;
  rollback_trigger: string;
  rollback_authority: string;
  rollback_scope: readonly string[];
  rollback_sequence: readonly string[];
  rollback_completed: boolean;
  rollback_evidence: readonly string[];
  integrity_hash: string;
}>;

export type ExecutionStateReplay = Readonly<{
  state_replay_id: string;
  reconstructed_states: readonly StateReplayEntry[];
  dependency_replay: readonly DependencyReplayEntry[];
  checkpoint_replay: readonly CheckpointReplayEntry[];
  rollback_replay: readonly RollbackReplayEntry[];
  final_execution_state: ExecutionReconstructionLifecycleState;
  state_replay_hash: string;
}>;

export type ExecutionReconstructionValidation = Readonly<{
  validation_id: string;
  reconstruction_id: string;
  outcome: ExecutionReconstructionOutcome;
  failures: readonly ExecutionReconstructionFailure[];
  timeline_deterministic: boolean;
  workflow_transitions_valid: boolean;
  task_order_exact: boolean;
  dependencies_valid: boolean;
  checkpoints_valid: boolean;
  rollbacks_valid: boolean;
  timing_valid: boolean;
  completion_verified: boolean;
  evidence_complete: boolean;
  integrity_verified: boolean;
  lineage_preserved: boolean;
  governance_compliant: boolean;
  constitutionally_compliant: boolean;
  tenant_isolated: boolean;
  speculative_history_generated: false;
  certification_ready: boolean;
  validation_hash: string;
}>;

export type ExecutionReconstructionPackage = Readonly<{
  package_id: string;
  engine_version: "autonomous-execution-reconstruction/v8G.2";
  source_replay_contract: ReplayContractPackage;
  identity: ExecutionReconstructionIdentity;
  timeline: ExecutionTimeline;
  graph: ExecutionGraph;
  state_replay: ExecutionStateReplay;
  validation: ExecutionReconstructionValidation;
  immutable: true;
  deterministic: true;
  speculative_history_permitted: false;
  package_hash: string;
}>;

export type ExecutionReconstructionVisibilitySurface = Readonly<{
  reconstruction_id: string;
  execution_id: string;
  workflow_id: string;
  outcome: ExecutionReconstructionOutcome;
  failure_reasons: readonly ExecutionReconstructionFailure[];
  timeline_events: number;
  graph_nodes: number;
  graph_edges: number;
  reconstructed_states: readonly ExecutionReconstructionLifecycleState[];
  checkpoint_count: number;
  rollback_count: number;
  final_execution_state: ExecutionReconstructionLifecycleState;
  integrity_status: "VALID" | "INVALID";
  certification_ready: boolean;
}>;

export type ExecutionReconstructionFramework = Readonly<{
  doctrine: Readonly<{
    principles: readonly string[];
    engine_version: "autonomous-execution-reconstruction/v8G.2";
    lifecycle_states: readonly ExecutionReconstructionLifecycleState[];
    event_types: readonly ExecutionTimelineEventType[];
    graph_node_types: readonly ExecutionGraphNodeType[];
    outcomes: readonly ExecutionReconstructionOutcome[];
  }>;
  package: ExecutionReconstructionPackage;
  visibility: ExecutionReconstructionVisibilitySurface;
}>;
