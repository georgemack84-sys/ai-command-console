import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildReplayContractPackage, computeReplayArtifactManifestHash, computeReplayGovernanceHash, computeReplayIdentityHash, computeReplayIntegrityHash, computeReplayOrderingHash } from "@/services/replay-contract";
import type { ReplayContractPackage } from "@/types/replay-contract";
import type {
  CheckpointReplayEntry,
  DependencyReplayEntry,
  ExecutionGraph,
  ExecutionGraphEdge,
  ExecutionGraphNode,
  ExecutionGraphNodeType,
  ExecutionReconstructionFailure,
  ExecutionReconstructionFramework,
  ExecutionReconstructionIdentity,
  ExecutionReconstructionLifecycleState,
  ExecutionReconstructionOutcome,
  ExecutionReconstructionPackage,
  ExecutionReconstructionScenario,
  ExecutionReconstructionValidation,
  ExecutionReconstructionVisibilitySurface,
  ExecutionStateReplay,
  ExecutionTimeline,
  ExecutionTimelineEvent,
  ExecutionTimelineEventType,
  RollbackReplayEntry,
  StateReplayEntry,
} from "@/types/autonomous-execution-reconstruction";

const NOW = "2026-06-30T08:00:00.000Z";
const VERSION = "autonomous-execution-reconstruction/v8G.2" as const;
const STATES = Object.freeze(["REGISTERED", "INITIALIZED", "READY", "EXECUTING", "CHECKPOINTING", "VALIDATING", "COMPLETED"] as const);
const LEGAL_TRANSITIONS: Readonly<Record<ExecutionReconstructionLifecycleState, readonly ExecutionReconstructionLifecycleState[]>> = Object.freeze({
  REGISTERED: ["INITIALIZED"],
  INITIALIZED: ["READY"],
  READY: ["EXECUTING"],
  EXECUTING: ["CHECKPOINTING", "RETRYING", "PAUSED", "RECOVERING", "ROLLBACK_READY", "ESCALATED", "TERMINATED", "FAILED"],
  CHECKPOINTING: ["VALIDATING"],
  VALIDATING: ["COMPLETED", "FAILED"],
  COMPLETED: [],
  RETRYING: ["EXECUTING", "FAILED"],
  PAUSED: ["EXECUTING", "TERMINATED"],
  RECOVERING: ["EXECUTING", "ROLLBACK_READY"],
  ROLLBACK_READY: ["ROLLING_BACK"],
  ROLLING_BACK: ["RECOVERING", "TERMINATED", "FAILED"],
  ESCALATED: ["PAUSED", "TERMINATED"],
  TERMINATED: [],
  FAILED: ["ROLLBACK_READY", "TERMINATED"],
});
const ORDER = Object.freeze(["MISSION", "WORKFLOW", "STAGE", "TASK", "SUBTASK", "CHECKPOINT", "COMPLETION"] as const);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values.filter(Boolean))].sort()); }
function id(prefix: string, domain: string, value: unknown) { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function timestamp(offsetMinutes: number) { return new Date(Date.parse(NOW) + offsetMinutes * 60_000).toISOString(); }

function identityHashSource(identity: Omit<ExecutionReconstructionIdentity, "integrity_hash"> | ExecutionReconstructionIdentity) {
  return {
    execution_reconstruction_id: identity.execution_reconstruction_id,
    tenant_id: identity.tenant_id,
    mission_id: identity.mission_id,
    workflow_id: identity.workflow_id,
    execution_id: identity.execution_id,
    execution_version: identity.execution_version,
    replay_reference: identity.replay_reference,
    timeline_reference: identity.timeline_reference,
    state_reference: identity.state_reference,
    checkpoint_reference: identity.checkpoint_reference,
    rollback_reference: identity.rollback_reference,
    integrity_reference: identity.integrity_reference,
    lineage_reference: identity.lineage_reference,
    created_timestamp: identity.created_timestamp,
  };
}
export function computeExecutionReconstructionIdentityHash(identity: Omit<ExecutionReconstructionIdentity, "integrity_hash"> | ExecutionReconstructionIdentity): string {
  return hashValue("execution-reconstruction-identity", identityHashSource(identity));
}

function buildIdentity(source: ReplayContractPackage, scenario: ExecutionReconstructionScenario): ExecutionReconstructionIdentity {
  const base = {
    execution_reconstruction_id: id("AER", "execution-reconstruction-id", { replay: source.replay_identity.replay_id, scenario }),
    tenant_id: scenario === "TENANT_VIOLATION" ? "tenant_beta" : source.replay_identity.tenant_id,
    mission_id: source.replay_identity.mission_id,
    workflow_id: source.replay_identity.workflow_id,
    execution_id: source.replay_identity.execution_id,
    execution_version: VERSION,
    replay_reference: source.package_hash,
    timeline_reference: id("AERT", "execution-reconstruction-timeline-ref", source.replay_identity.replay_id),
    state_reference: id("AERS", "execution-reconstruction-state-ref", source.replay_identity.execution_id),
    checkpoint_reference: scenario === "CHECKPOINT_MISMATCH" ? "" : "checkpoint:execution-reconstruction:v8g2",
    rollback_reference: scenario === "ROLLBACK_DIVERGENCE" ? "rollback:divergent:v8g2" : "rollback:not-required:v8g2",
    integrity_reference: scenario === "INTEGRITY_VIOLATION" ? "tampered-integrity-reference" : source.integrity_record.integrity_hash,
    lineage_reference: scenario === "LINEAGE_BREAK" ? "" : source.replay_identity.lineage_reference,
    created_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VIOLATION" ? "tampered-execution-reconstruction-identity" : computeExecutionReconstructionIdentityHash(base) });
}

function eventHashSource(event: Omit<ExecutionTimelineEvent, "integrity_hash"> | ExecutionTimelineEvent) {
  return {
    event_id: event.event_id,
    event_type: event.event_type,
    sequence: event.sequence,
    phase: event.phase,
    state: event.state,
    timestamp: event.timestamp,
    relative_offset_ms: event.relative_offset_ms,
    causal_parent: event.causal_parent,
    artifact_refs: event.artifact_refs,
    governance_reference: event.governance_reference,
    replay_reference: event.replay_reference,
    lineage_reference: event.lineage_reference,
  };
}
function buildEvent(identity: ExecutionReconstructionIdentity, sequence: number, phase: ExecutionGraphNodeType, state: ExecutionReconstructionLifecycleState, type: ExecutionTimelineEventType, scenario: ExecutionReconstructionScenario, parent: string | null): ExecutionTimelineEvent {
  const base = {
    event_id: id("AERE", "execution-reconstruction-event-id", { reconstruction: identity.execution_reconstruction_id, sequence, state, type }),
    event_type: type,
    sequence,
    phase,
    state,
    timestamp: timestamp(scenario === "TIMING_MISMATCH" && sequence === 4 ? 1 : sequence * 3),
    relative_offset_ms: scenario === "TIMING_MISMATCH" && sequence === 4 ? 500 : sequence * 180_000,
    causal_parent: parent,
    artifact_refs: scenario === "MISSING_EVIDENCE" && sequence === 3 ? freezeArray<string>([]) : freezeArray([`artifact:${phase.toLowerCase()}:${sequence}`, identity.integrity_reference]),
    governance_reference: scenario === "GOVERNANCE_FAILURE" && sequence >= 4 ? "" : "governance:approved:v8g2",
    replay_reference: identity.replay_reference,
    lineage_reference: identity.lineage_reference,
  };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VIOLATION" && sequence === 5 ? "tampered-event-hash" : hashValue("execution-reconstruction-event", eventHashSource(base)) });
}

function timelineHashSource(timeline: Omit<ExecutionTimeline, "timeline_hash"> | ExecutionTimeline) {
  return {
    timeline_id: timeline.timeline_id,
    execution_id: timeline.execution_id,
    workflow_id: timeline.workflow_id,
    events: timeline.events.map((event) => ({ id: event.event_id, hash: event.integrity_hash, sequence: event.sequence })),
    event_order: timeline.event_order,
    start_timestamp: timeline.start_timestamp,
    completion_timestamp: timeline.completion_timestamp,
    relative_duration_ms: timeline.relative_duration_ms,
  };
}
export function computeExecutionTimelineHash(timeline: Omit<ExecutionTimeline, "timeline_hash"> | ExecutionTimeline): string {
  return hashValue("execution-reconstruction-timeline", timelineHashSource(timeline));
}

function buildTimeline(identity: ExecutionReconstructionIdentity, scenario: ExecutionReconstructionScenario): ExecutionTimeline {
  const states = scenario === "MISSING_STATE" ? ["REGISTERED", "INITIALIZED", "EXECUTING", "CHECKPOINTING", "VALIDATING", "COMPLETED"] as const : scenario === "INVALID_TRANSITION" ? ["REGISTERED", "EXECUTING", "CHECKPOINTING", "VALIDATING", "COMPLETED"] as const : STATES;
  const types: readonly ExecutionTimelineEventType[] = ["STATE_TRANSITION", "GOVERNANCE_APPROVED", "DEPENDENCY_RESOLVED", "TASK_STARTED", "TASK_COMPLETED", "CHECKPOINT_CREATED", "CHECKPOINT_VALIDATED", "EXECUTION_COMPLETED"];
  let previous: string | null = null;
  const events = states.map((state, index) => {
    const phase = ORDER[Math.min(index, ORDER.length - 1)];
    const event = buildEvent(identity, index + 1, phase, state, types[Math.min(index, types.length - 1)], scenario, previous);
    previous = event.event_id;
    return event;
  });
  const effectiveEvents = scenario === "EXECUTION_DIVERGENCE" ? events.map((event, index) => {
    const sequence = index === 3 ? 99 : index + 1;
    return Object.freeze({ ...event, sequence, integrity_hash: hashValue("execution-reconstruction-event", eventHashSource({ ...event, sequence })) });
  }) : events;
  const base = {
    timeline_id: identity.timeline_reference,
    execution_id: identity.execution_id,
    workflow_id: identity.workflow_id,
    events: freezeArray(effectiveEvents),
    event_order: freezeArray(effectiveEvents.map((event) => event.event_id)),
    start_timestamp: effectiveEvents[0]?.timestamp ?? NOW,
    completion_timestamp: scenario === "COMPLETION_INCOMPLETE" ? null : effectiveEvents[effectiveEvents.length - 1]?.timestamp ?? null,
    relative_duration_ms: effectiveEvents[effectiveEvents.length - 1]?.relative_offset_ms ?? 0,
  };
  return Object.freeze({ ...base, timeline_hash: computeExecutionTimelineHash(base) });
}

function nodeHashSource(node: Omit<ExecutionGraphNode, "integrity_hash"> | ExecutionGraphNode) {
  return { node_id: node.node_id, node_type: node.node_type, label: node.label, sequence: node.sequence, evidence_ref: node.evidence_ref };
}
function edgeHashSource(edge: Omit<ExecutionGraphEdge, "integrity_hash"> | ExecutionGraphEdge) {
  return { edge_id: edge.edge_id, edge_type: edge.edge_type, from_node: edge.from_node, to_node: edge.to_node, ordering: edge.ordering, evidence_ref: edge.evidence_ref };
}
function buildGraph(identity: ExecutionReconstructionIdentity, timeline: ExecutionTimeline, scenario: ExecutionReconstructionScenario): ExecutionGraph {
  const nodes = freezeArray(ORDER.map((nodeType, index) => {
    const base = { node_id: id("AERN", "execution-reconstruction-node-id", { reconstruction: identity.execution_reconstruction_id, nodeType }), node_type: nodeType, label: nodeType.toLowerCase(), sequence: index + 1, evidence_ref: scenario === "MISSING_EVIDENCE" && nodeType === "TASK" ? "" : timeline.events[Math.min(index, timeline.events.length - 1)]?.event_id ?? "" };
    return Object.freeze({ ...base, integrity_hash: hashValue("execution-reconstruction-node", nodeHashSource(base)) });
  }));
  const edges = freezeArray(nodes.slice(1).map((node, index) => {
    const from = nodes[index];
    const edgeType: ExecutionGraphEdge["edge_type"] = node.node_type === "CHECKPOINT" ? "CHECKPOINT" : node.node_type === "COMPLETION" ? "COMPLETION" : index === 2 ? "DEPENDENCY" : "TRANSITION";
    const base = { edge_id: id("AERX", "execution-reconstruction-edge-id", { from: from.node_id, to: node.node_id, scenario }), edge_type: edgeType, from_node: from.node_id, to_node: node.node_id, ordering: scenario === "DEPENDENCY_MISMATCH" && edgeType === "DEPENDENCY" ? 1 : index + 1, evidence_ref: node.evidence_ref };
    return Object.freeze({ ...base, integrity_hash: hashValue("execution-reconstruction-edge", edgeHashSource(base)) });
  }));
  const rollbackPaths = scenario === "ROLLBACK_DIVERGENCE" ? freezeArray(["rollback:historical", "rollback:reconstructed-divergent"]) : freezeArray<string>([]);
  const base = {
    graph_id: id("AERG", "execution-reconstruction-graph-id", identity.execution_reconstruction_id),
    nodes,
    edges,
    dependency_edges: freezeArray(edges.filter((edge) => edge.edge_type === "DEPENDENCY").map((edge) => edge.edge_id)),
    transition_edges: freezeArray(edges.filter((edge) => edge.edge_type === "TRANSITION").map((edge) => edge.edge_id)),
    checkpoint_nodes: freezeArray(nodes.filter((node) => node.node_type === "CHECKPOINT").map((node) => node.node_id)),
    rollback_paths: rollbackPaths,
    completion_nodes: freezeArray(nodes.filter((node) => node.node_type === "COMPLETION").map((node) => node.node_id)),
  };
  return Object.freeze({ ...base, graph_hash: hashValue("execution-reconstruction-graph", { nodes: nodes.map((node) => node.integrity_hash), edges: edges.map((edge) => edge.integrity_hash), rollbackPaths }) });
}

function buildStateReplay(identity: ExecutionReconstructionIdentity, timeline: ExecutionTimeline, graph: ExecutionGraph, scenario: ExecutionReconstructionScenario): ExecutionStateReplay {
  const states = freezeArray(timeline.events.map((event, index): StateReplayEntry => {
    const previous = timeline.events[index - 1]?.state ?? null;
    const next = timeline.events[index + 1]?.state ?? null;
    const base = { state_id: id("AERSR", "execution-reconstruction-state-id", event.event_id), previous_state: previous, next_state: next, transition_reason: `${event.event_type}:${event.phase}`, execution_timestamp: event.timestamp, replay_reference: event.replay_reference, governance_reference: event.governance_reference };
    return Object.freeze({ ...base, integrity_hash: hashValue("execution-reconstruction-state", base) });
  }));
  const dependency = {
    dependency_id: id("AERD", "execution-reconstruction-dependency-id", identity.execution_reconstruction_id),
    prerequisite_task: "task:prepare-inputs",
    downstream_task: "task:execute-workflow",
    activated_at_sequence: 3,
    completed_at_sequence: scenario === "DEPENDENCY_MISMATCH" ? 2 : 4,
    dependency_completed: scenario !== "DEPENDENCY_MISMATCH",
    dependency_timing_valid: scenario !== "DEPENDENCY_MISMATCH",
    dependency_ordering_valid: scenario !== "DEPENDENCY_MISMATCH",
    replay_deterministic: scenario !== "DEPENDENCY_MISMATCH",
  };
  const dependencies = freezeArray<DependencyReplayEntry>([Object.freeze({ ...dependency, integrity_hash: hashValue("execution-reconstruction-dependency", dependency) })]);
  const checkpoint = {
    checkpoint_id: identity.checkpoint_reference,
    execution_state: "CHECKPOINTING" as const,
    completed_tasks: freezeArray(["task:prepare-inputs", "task:execute-workflow"]),
    remaining_tasks: freezeArray(["task:validate", "task:complete"]),
    dependency_status: scenario === "DEPENDENCY_MISMATCH" ? "MISMATCH" as const : "SATISFIED" as const,
    runtime_health: "HEALTHY" as const,
    governance_status: scenario === "GOVERNANCE_FAILURE" ? "MISSING" as const : "VALIDATED" as const,
    confidence_score: scenario === "CHECKPOINT_MISMATCH" ? 0.41 : 1,
    timestamp: timestamp(18),
  };
  const checkpoints = scenario === "CHECKPOINT_MISMATCH" ? freezeArray<CheckpointReplayEntry>([Object.freeze({ ...checkpoint, checkpoint_id: "", integrity_hash: "missing-checkpoint" })]) : freezeArray<CheckpointReplayEntry>([Object.freeze({ ...checkpoint, integrity_hash: hashValue("execution-reconstruction-checkpoint", checkpoint) })]);
  const rollback = {
    rollback_id: identity.rollback_reference,
    rollback_trigger: scenario === "ROLLBACK_DIVERGENCE" ? "dependency-replay-divergence" : "not-required",
    rollback_authority: scenario === "ROLLBACK_DIVERGENCE" ? "" : "authority:execution-reconstruction:v8g2",
    rollback_scope: freezeArray(scenario === "ROLLBACK_DIVERGENCE" ? ["workflow", "unapproved-task"] : []),
    rollback_sequence: freezeArray(scenario === "ROLLBACK_DIVERGENCE" ? ["task:execute-workflow", "task:prepare-inputs"] : []),
    rollback_completed: scenario !== "ROLLBACK_DIVERGENCE",
    rollback_evidence: freezeArray(scenario === "ROLLBACK_DIVERGENCE" ? [] : ["rollback:not-required:evidence"]),
  };
  const rollbacks = freezeArray<RollbackReplayEntry>([Object.freeze({ ...rollback, integrity_hash: hashValue("execution-reconstruction-rollback", rollback) })]);
  const base = {
    state_replay_id: identity.state_reference,
    reconstructed_states: states,
    dependency_replay: dependencies,
    checkpoint_replay: checkpoints,
    rollback_replay: rollbacks,
    final_execution_state: scenario === "COMPLETION_INCOMPLETE" ? "VALIDATING" as const : states[states.length - 1]?.next_state ?? "COMPLETED" as const,
  };
  return Object.freeze({ ...base, state_replay_hash: hashValue("execution-reconstruction-state-replay", { states: states.map((state) => state.integrity_hash), dependencies: dependencies.map((item) => item.integrity_hash), checkpoints: checkpoints.map((item) => item.integrity_hash), rollbacks: rollbacks.map((item) => item.integrity_hash), graph: graph.graph_hash, final: base.final_execution_state }) });
}

function validationHashSource(validation: Omit<ExecutionReconstructionValidation, "validation_hash"> | ExecutionReconstructionValidation) {
  return {
    validation_id: validation.validation_id,
    reconstruction_id: validation.reconstruction_id,
    outcome: validation.outcome,
    failures: validation.failures,
    timeline_deterministic: validation.timeline_deterministic,
    workflow_transitions_valid: validation.workflow_transitions_valid,
    task_order_exact: validation.task_order_exact,
    dependencies_valid: validation.dependencies_valid,
    checkpoints_valid: validation.checkpoints_valid,
    rollbacks_valid: validation.rollbacks_valid,
    timing_valid: validation.timing_valid,
    completion_verified: validation.completion_verified,
    evidence_complete: validation.evidence_complete,
    integrity_verified: validation.integrity_verified,
    lineage_preserved: validation.lineage_preserved,
    governance_compliant: validation.governance_compliant,
    constitutionally_compliant: validation.constitutionally_compliant,
    tenant_isolated: validation.tenant_isolated,
    speculative_history_generated: validation.speculative_history_generated,
    certification_ready: validation.certification_ready,
  };
}
export function computeExecutionReconstructionValidationHash(validation: Omit<ExecutionReconstructionValidation, "validation_hash"> | ExecutionReconstructionValidation): string {
  return hashValue("execution-reconstruction-validation", validationHashSource(validation));
}

function collectFailures(source: ReplayContractPackage, identity: ExecutionReconstructionIdentity, timeline: ExecutionTimeline, graph: ExecutionGraph, stateReplay: ExecutionStateReplay, scenario: ExecutionReconstructionScenario): readonly ExecutionReconstructionFailure[] {
  const failures: ExecutionReconstructionFailure[] = [];
  const stateNames = timeline.events.map((event) => event.state);
  if (!stateNames.includes("READY")) failures.push("MISSING_STATE");
  timeline.events.slice(1).forEach((event, index) => {
    const previous = timeline.events[index].state;
    if (!LEGAL_TRANSITIONS[previous].includes(event.state)) failures.push("INVALID_TRANSITION");
  });
  if (timeline.events.some((event, index) => event.sequence !== index + 1)) failures.push("EXECUTION_DIVERGENCE");
  if (timeline.events.some((event, index) => index > 0 && event.relative_offset_ms <= timeline.events[index - 1].relative_offset_ms)) failures.push("TIMING_MISMATCH");
  if (timeline.events.some((event) => event.artifact_refs.length === 0) || graph.nodes.some((node) => !node.evidence_ref)) failures.push("MISSING_EVIDENCE");
  if (stateReplay.dependency_replay.some((dependency) => !dependency.dependency_completed || !dependency.dependency_timing_valid || !dependency.dependency_ordering_valid || dependency.completed_at_sequence <= dependency.activated_at_sequence)) failures.push("DEPENDENCY_MISMATCH");
  if (stateReplay.checkpoint_replay.some((checkpoint) => !checkpoint.checkpoint_id || checkpoint.dependency_status === "MISMATCH" || checkpoint.confidence_score < 0.9)) failures.push("CHECKPOINT_MISMATCH");
  if (stateReplay.rollback_replay.some((rollback) => !rollback.rollback_completed || !rollback.rollback_authority || rollback.rollback_evidence.length === 0)) failures.push("ROLLBACK_DIVERGENCE");
  if (computeExecutionReconstructionIdentityHash(identity) !== identity.integrity_hash || computeExecutionTimelineHash(timeline) !== timeline.timeline_hash || timeline.events.some((event) => hashValue("execution-reconstruction-event", eventHashSource(event)) !== event.integrity_hash) || scenario === "INTEGRITY_VIOLATION") failures.push("INTEGRITY_VIOLATION");
  if (!identity.lineage_reference || timeline.events.some((event) => !event.lineage_reference)) failures.push("LINEAGE_BREAK");
  if (timeline.events.some((event) => !event.governance_reference) || source.governance.governance_state !== "VALID") failures.push("GOVERNANCE_APPROVAL_MISSING");
  if (scenario === "CONSTITUTIONAL_VIOLATION" || source.governance.constitution_version !== source.source_boundary_certification.constitution_version) failures.push("CONSTITUTIONAL_VALIDATION_FAILED");
  if (identity.tenant_id !== source.replay_identity.tenant_id) failures.push("TENANT_ISOLATION_VIOLATION");
  if (stateReplay.final_execution_state !== "COMPLETED" || timeline.completion_timestamp === null) failures.push("COMPLETION_INCOMPLETE");
  if (source.validation.validation_state === "FAIL") failures.push("EXECUTION_DIVERGENCE");
  return unique(failures);
}

function outcomeFor(failures: readonly ExecutionReconstructionFailure[]): ExecutionReconstructionOutcome {
  if (!failures.length) return "VERIFIED";
  if (failures.every((failure) => failure === "MISSING_EVIDENCE")) return "PARTIAL";
  if (failures.some((failure) => ["INVALID_TRANSITION", "INTEGRITY_VIOLATION", "GOVERNANCE_APPROVAL_MISSING", "CONSTITUTIONAL_VALIDATION_FAILED", "TENANT_ISOLATION_VIOLATION", "LINEAGE_BREAK"].includes(failure))) return "INVALID";
  return "MISMATCH";
}

function buildValidation(source: ReplayContractPackage, identity: ExecutionReconstructionIdentity, timeline: ExecutionTimeline, graph: ExecutionGraph, stateReplay: ExecutionStateReplay, scenario: ExecutionReconstructionScenario): ExecutionReconstructionValidation {
  const failures = collectFailures(source, identity, timeline, graph, stateReplay, scenario);
  const has = (failure: ExecutionReconstructionFailure) => failures.includes(failure);
  const outcome = outcomeFor(failures);
  const base = {
    validation_id: id("AERV", "execution-reconstruction-validation-id", { reconstruction: identity.execution_reconstruction_id, failures }),
    reconstruction_id: identity.execution_reconstruction_id,
    outcome,
    failures,
    timeline_deterministic: !has("EXECUTION_DIVERGENCE") && !has("TIMING_MISMATCH"),
    workflow_transitions_valid: !has("MISSING_STATE") && !has("INVALID_TRANSITION"),
    task_order_exact: !has("EXECUTION_DIVERGENCE"),
    dependencies_valid: !has("DEPENDENCY_MISMATCH"),
    checkpoints_valid: !has("CHECKPOINT_MISMATCH"),
    rollbacks_valid: !has("ROLLBACK_DIVERGENCE"),
    timing_valid: !has("TIMING_MISMATCH"),
    completion_verified: !has("COMPLETION_INCOMPLETE"),
    evidence_complete: !has("MISSING_EVIDENCE"),
    integrity_verified: !has("INTEGRITY_VIOLATION"),
    lineage_preserved: !has("LINEAGE_BREAK"),
    governance_compliant: !has("GOVERNANCE_APPROVAL_MISSING"),
    constitutionally_compliant: !has("CONSTITUTIONAL_VALIDATION_FAILED"),
    tenant_isolated: !has("TENANT_ISOLATION_VIOLATION"),
    speculative_history_generated: false as const,
    certification_ready: outcome === "VERIFIED",
  };
  return Object.freeze({ ...base, validation_hash: computeExecutionReconstructionValidationHash(base) });
}

function packageHashSource(pkg: Omit<ExecutionReconstructionPackage, "package_hash">) {
  return {
    package_id: pkg.package_id,
    engine_version: pkg.engine_version,
    source_replay_hash: pkg.source_replay_contract.package_hash,
    identity_hash: pkg.identity.integrity_hash,
    timeline_hash: pkg.timeline.timeline_hash,
    graph_hash: pkg.graph.graph_hash,
    state_replay_hash: pkg.state_replay.state_replay_hash,
    validation_hash: pkg.validation.validation_hash,
  };
}

export function buildExecutionReconstructionPackage(input: { scenario?: ExecutionReconstructionScenario; sourceReplayContract?: ReplayContractPackage } = {}): ExecutionReconstructionPackage {
  const scenario = input.scenario ?? "BASELINE";
  const source_replay_contract = input.sourceReplayContract ?? buildReplayContractPackage({ scenario: scenario === "GOVERNANCE_FAILURE" ? "GOVERNANCE_FAILURE" : scenario === "LINEAGE_BREAK" ? "LINEAGE_FAILURE" : "BASELINE", replay_type: "EXECUTION", replay_scope: "WORKFLOW" });
  const identity = buildIdentity(source_replay_contract, scenario);
  const timeline = buildTimeline(identity, scenario);
  const graph = buildGraph(identity, timeline, scenario);
  const state_replay = buildStateReplay(identity, timeline, graph, scenario);
  const validation = buildValidation(source_replay_contract, identity, timeline, graph, state_replay, scenario);
  const full = { package_id: id("AERP", "execution-reconstruction-package-id", { replay: source_replay_contract.package_hash, scenario }), engine_version: VERSION, source_replay_contract, identity, timeline, graph, state_replay, validation, immutable: true as const, deterministic: true as const, speculative_history_permitted: false as const };
  return Object.freeze({ ...full, package_hash: hashValue("execution-reconstruction-package", packageHashSource(full)) });
}

export function buildExecutionReconstructionVisibilitySurface(pkg = buildExecutionReconstructionPackage()): ExecutionReconstructionVisibilitySurface {
  return Object.freeze({
    reconstruction_id: pkg.identity.execution_reconstruction_id,
    execution_id: pkg.identity.execution_id,
    workflow_id: pkg.identity.workflow_id,
    outcome: pkg.validation.outcome,
    failure_reasons: pkg.validation.failures,
    timeline_events: pkg.timeline.events.length,
    graph_nodes: pkg.graph.nodes.length,
    graph_edges: pkg.graph.edges.length,
    reconstructed_states: freezeArray(pkg.state_replay.reconstructed_states.map((state) => state.next_state ?? state.previous_state ?? "REGISTERED")),
    checkpoint_count: pkg.state_replay.checkpoint_replay.length,
    rollback_count: pkg.state_replay.rollback_replay.filter((rollback) => rollback.rollback_sequence.length > 0).length,
    final_execution_state: pkg.state_replay.final_execution_state,
    integrity_status: pkg.validation.integrity_verified ? "VALID" : "INVALID",
    certification_ready: pkg.validation.certification_ready,
  });
}

export function getExecutionReconstructionFramework(): ExecutionReconstructionFramework {
  const pkg = buildExecutionReconstructionPackage();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic", "complete", "immutable", "replayable", "explainable", "governance-aware", "constitutionally-compliant", "tenant-isolated", "cryptographically-verifiable", "independently-reproducible", "fail-closed", "no-speculative-history"]),
      engine_version: VERSION,
      lifecycle_states: freezeArray(["REGISTERED", "INITIALIZED", "READY", "EXECUTING", "CHECKPOINTING", "VALIDATING", "COMPLETED", "RETRYING", "PAUSED", "RECOVERING", "ROLLBACK_READY", "ROLLING_BACK", "ESCALATED", "TERMINATED", "FAILED"] as const),
      event_types: freezeArray(["STATE_TRANSITION", "TASK_STARTED", "TASK_COMPLETED", "DEPENDENCY_RESOLVED", "CHECKPOINT_CREATED", "CHECKPOINT_VALIDATED", "ROLLBACK_TRIGGERED", "ROLLBACK_COMPLETED", "GOVERNANCE_APPROVED", "SUPERVISION_OBSERVED", "EXECUTION_COMPLETED"] as const),
      graph_node_types: freezeArray(["MISSION", "WORKFLOW", "STAGE", "TASK", "SUBTASK", "CHECKPOINT", "ROLLBACK", "COMPLETION"] as const),
      outcomes: freezeArray(["VERIFIED", "PARTIAL", "MISMATCH", "INVALID"] as const),
    }),
    package: pkg,
    visibility: buildExecutionReconstructionVisibilitySurface(pkg),
  });
}

export function verifyReplayContractHashes(pkg: ReplayContractPackage): boolean {
  return computeReplayIdentityHash(pkg.replay_identity) === pkg.replay_identity.integrity_hash
    && computeReplayArtifactManifestHash(pkg.artifact_manifest) === pkg.artifact_manifest.manifest_hash
    && computeReplayOrderingHash(pkg.ordering) === pkg.ordering.ordering_hash
    && computeReplayIntegrityHash(pkg.integrity_record) === pkg.integrity_record.integrity_hash
    && computeReplayGovernanceHash(pkg.governance) === pkg.governance.governance_hash;
}
