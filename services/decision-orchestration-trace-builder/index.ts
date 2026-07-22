import { captureDecisionReplaySnapshots } from "@/services/decision-replay-snapshot-capture";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type { DecisionReplayArtifactRef } from "@/types/decision-replay-contract";
import type { ReplaySnapshotCaptureResult, ReplaySnapshotRecord, ReplaySnapshotType } from "@/types/decision-replay-snapshot-capture";
import type {
  DependencyTraceRecord,
  OrchestrationExecutionPhase,
  OrchestrationTraceBuilderFoundation,
  OrchestrationTraceBuilderResult,
  OrchestrationTraceEventType,
  OrchestrationTraceFailure,
  OrchestrationTraceRecord,
  OrchestrationTraceState,
  OrchestrationTraceValidation,
  TimelineRecord,
  TraceEvent,
  TraceEventSource,
  TraceIdentity,
  TraceLedgerEntry,
  TraceVisualizationModel,
} from "@/types/decision-orchestration-trace-builder";

const BUILDER_VERSION = "decision-orchestration-trace-builder/v1" as const;
const TRACE_VERSION = "decision-orchestration-trace/v1" as const;
const TRACE_SCHEMA_VERSION = "decision-orchestration-trace-schema/v1" as const;
const NOW = "2026-07-05T01:30:00.000Z";

export const ORCHESTRATION_EXECUTION_PHASES: readonly OrchestrationExecutionPhase[] = Object.freeze(["INTAKE", "NORMALIZATION", "CONTEXT_BUILDING", "DEPENDENCY_ANALYSIS", "PRIORITIZATION", "ARBITRATION", "GOVERNANCE_VALIDATION", "PACKAGE_GENERATION", "OPERATOR_WORKFLOW", "FINALIZATION", "COMPLETED"]);
export const REQUIRED_TRACE_EVENT_TYPES: readonly OrchestrationTraceEventType[] = Object.freeze(["INTAKE_TRACE", "NORMALIZATION_TRACE", "CONTEXT_TRACE", "DEPENDENCY_TRACE", "PRIORITY_TRACE", "ARBITRATION_TRACE", "GOVERNANCE_TRACE", "PACKAGE_TRACE", "OPERATOR_TRACE", "FINAL_DECISION_TRACE"]);
export const ORCHESTRATION_TRACE_STATES: readonly OrchestrationTraceState[] = Object.freeze(["CREATED", "COLLECTING", "VALIDATED", "COMMITTED", "AVAILABLE_FOR_REPLAY", "CERTIFIED", "ARCHIVED", "REJECTED"]);
export const ORCHESTRATION_TRACE_TERMINAL_STATES: readonly OrchestrationTraceState[] = Object.freeze(["AVAILABLE_FOR_REPLAY", "CERTIFIED", "ARCHIVED", "REJECTED"]);

type TraceScenario =
  | "BASELINE"
  | "MISSING_EVENT"
  | "DUPLICATE_SEQUENCE"
  | "CORRUPTED_TRACE"
  | "INCOMPLETE_LINEAGE"
  | "MISSING_REPLAY_REF"
  | "MISSING_GOVERNANCE"
  | "MISSING_CONSTITUTIONAL"
  | "UNSUPPORTED_SCHEMA"
  | "UNKNOWN_PHASE"
  | "CROSS_TENANT"
  | "DEPENDENCY_INCONSISTENCY"
  | "LEDGER_FAILURE"
  | "ORDERING_INVALID";

type BuildInput = Readonly<{
  snapshot_capture?: ReplaySnapshotCaptureResult;
  scenario?: TraceScenario;
}>;

const EVENT_MAP: Record<ReplaySnapshotType, { event_type: OrchestrationTraceEventType; execution_phase: OrchestrationExecutionPhase }> = {
  DECISION_CANDIDATE: { event_type: "INTAKE_TRACE", execution_phase: "INTAKE" },
  NORMALIZED_CANDIDATE: { event_type: "NORMALIZATION_TRACE", execution_phase: "NORMALIZATION" },
  DECISION_CONTEXT: { event_type: "CONTEXT_TRACE", execution_phase: "CONTEXT_BUILDING" },
  DEPENDENCY_GRAPH: { event_type: "DEPENDENCY_TRACE", execution_phase: "DEPENDENCY_ANALYSIS" },
  PRIORITY_RANKING: { event_type: "PRIORITY_TRACE", execution_phase: "PRIORITIZATION" },
  CONFLICT_ANALYSIS: { event_type: "ARBITRATION_TRACE", execution_phase: "ARBITRATION" },
  GOVERNANCE_VALIDATION: { event_type: "GOVERNANCE_TRACE", execution_phase: "GOVERNANCE_VALIDATION" },
  DECISION_PACKAGE: { event_type: "PACKAGE_TRACE", execution_phase: "PACKAGE_GENERATION" },
  OPERATOR_ACTION: { event_type: "OPERATOR_TRACE", execution_phase: "OPERATOR_WORKFLOW" },
  FINAL_DECISION: { event_type: "FINAL_DECISION_TRACE", execution_phase: "FINALIZATION" },
};

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function traceIdentity(capture: ReplaySnapshotCaptureResult): TraceIdentity {
  return Object.freeze({
    trace_id: `trace_${capture.replay_contract.orchestration_id}`,
    orchestration_id: capture.replay_contract.orchestration_id,
    mission_id: capture.replay_contract.mission_id,
    tenant_id: capture.replay_contract.tenant_id,
    trace_version: TRACE_VERSION,
  });
}

function eventHashSource(event: Omit<TraceEvent, "integrity_hash"> | TraceEvent): object {
  return {
    trace_id: event.trace_id,
    event_id: event.event_id,
    execution_phase: event.execution_phase,
    sequence_number: event.sequence_number,
    lineage_refs: event.lineage_refs,
    event_payload_ref: event.event_payload_ref,
    snapshot_ref: event.snapshot_ref,
    schema_version: TRACE_SCHEMA_VERSION,
  };
}

export function computeTraceEventIntegrityHash(event: Omit<TraceEvent, "integrity_hash"> | TraceEvent): string {
  return hash(eventHashSource(event));
}

function eventSources(capture: ReplaySnapshotCaptureResult, scenario: TraceScenario): readonly TraceEventSource[] {
  const snapshots = scenario === "MISSING_EVENT" ? capture.snapshots.filter((snapshot) => snapshot.snapshot_type !== "FINAL_DECISION") : capture.snapshots;
  return freezeArray(snapshots.map((snapshot) => Object.freeze({
    snapshot,
    event_type: EVENT_MAP[snapshot.snapshot_type].event_type,
    execution_phase: EVENT_MAP[snapshot.snapshot_type].execution_phase,
  })));
}

function buildEvents(identity: TraceIdentity, capture: ReplaySnapshotCaptureResult, scenario: TraceScenario): readonly TraceEvent[] {
  const sources = eventSources(capture, scenario);
  const events = sources.map((source, index) => {
    const sequence = scenario === "DUPLICATE_SEQUENCE" && index === 1 ? 1 : index + 1;
    const parent = index === 0 ? null : `event_${String(index).padStart(2, "0")}_${sources[index - 1]!.event_type.toLowerCase()}_${identity.trace_id}`;
    const related = index === sources.length - 1 ? [] : [`event_${String(index + 2).padStart(2, "0")}_${sources[index + 1]!.event_type.toLowerCase()}_${identity.trace_id}`];
    const base: Omit<TraceEvent, "integrity_hash"> = {
      event_id: `event_${String(index + 1).padStart(2, "0")}_${source.event_type.toLowerCase()}_${identity.trace_id}`,
      trace_id: identity.trace_id,
      event_type: source.event_type,
      execution_phase: scenario === "UNKNOWN_PHASE" && index === sources.length - 1 ? "UNKNOWN" as OrchestrationExecutionPhase : source.execution_phase,
      sequence_number: sequence,
      event_timestamp: `${NOW}#${String(index + 1).padStart(2, "0")}`,
      parent_event_id: parent,
      related_event_ids: freezeArray(related),
      event_payload_ref: source.snapshot.snapshot_id,
      snapshot_ref: source.snapshot.snapshot_id,
      lineage_refs: scenario === "INCOMPLETE_LINEAGE" && index === sources.length - 1 ? freezeArray([]) : source.snapshot.lineage_refs,
      replay_refs: scenario === "MISSING_REPLAY_REF" && index === sources.length - 1 ? freezeArray([]) : source.snapshot.replay_refs,
      governance_refs: scenario === "MISSING_GOVERNANCE" && source.event_type === "GOVERNANCE_TRACE" ? freezeArray([]) : source.snapshot.governance_refs,
      constitutional_refs: scenario === "MISSING_CONSTITUTIONAL" && source.event_type === "GOVERNANCE_TRACE" ? freezeArray([]) : source.snapshot.constitutional_refs,
    };
    const event = Object.freeze({ ...base, integrity_hash: computeTraceEventIntegrityHash(base) });
    if (scenario === "CORRUPTED_TRACE" && index === sources.length - 1) return Object.freeze({ ...event, integrity_hash: hash({ corrupted: event.event_id }) });
    if (scenario === "CROSS_TENANT" && index === sources.length - 1) {
      const badRef = event.lineage_refs[0] ? Object.freeze({ ...event.lineage_refs[0], tenant_id: "tenant_other" }) : undefined;
      const altered: Omit<TraceEvent, "integrity_hash"> = { ...event, lineage_refs: freezeArray(badRef ? [badRef] : []) };
      return Object.freeze({ ...altered, integrity_hash: computeTraceEventIntegrityHash(altered) });
    }
    return event;
  });
  if (scenario === "ORDERING_INVALID") return freezeArray([...events].reverse());
  return freezeArray(events);
}

function timelineHash(record: Omit<TimelineRecord, "integrity_hash"> | TimelineRecord): string {
  return hashWithoutIntegrity(record);
}

function buildTimeline(identity: TraceIdentity, events: readonly TraceEvent[]): TimelineRecord {
  const base: Omit<TimelineRecord, "integrity_hash"> = {
    timeline_id: `timeline_${identity.trace_id}`,
    trace_id: identity.trace_id,
    ordered_events: freezeArray(events.map((event) => event.event_id)),
    phase_sequence: freezeArray(events.map((event) => event.execution_phase)),
    execution_start: events[0]?.event_timestamp ?? NOW,
    execution_end: events[events.length - 1]?.event_timestamp ?? NOW,
    replay_ready: events.length === REQUIRED_TRACE_EVENT_TYPES.length,
  };
  return Object.freeze({ ...base, integrity_hash: timelineHash(base) });
}

function dependencyHash(record: Omit<DependencyTraceRecord, "integrity_hash"> | DependencyTraceRecord): string {
  return hashWithoutIntegrity(record);
}

function buildDependencyTrace(events: readonly TraceEvent[], scenario: TraceScenario): readonly DependencyTraceRecord[] {
  if (scenario === "DEPENDENCY_INCONSISTENCY") {
    const base: Omit<DependencyTraceRecord, "integrity_hash"> = {
      dependency_trace_id: "dependency_trace_broken",
      source_event: events[0]?.event_id ?? "",
      target_event: "missing_event",
      dependency_type: "SEQUENTIAL",
      resolution_status: "BLOCKED",
      lineage_refs: freezeArray(events[0]?.lineage_refs ?? []),
    };
    return freezeArray([Object.freeze({ ...base, integrity_hash: dependencyHash(base) })]);
  }
  return freezeArray(events.slice(0, -1).map((event, index) => {
    const next = events[index + 1]!;
    const base: Omit<DependencyTraceRecord, "integrity_hash"> = {
      dependency_trace_id: `dependency_trace_${String(index + 1).padStart(2, "0")}_${event.event_id}`,
      source_event: event.event_id,
      target_event: next.event_id,
      dependency_type: next.execution_phase === "GOVERNANCE_VALIDATION" ? "GOVERNANCE" : next.execution_phase === "OPERATOR_WORKFLOW" ? "OPERATOR" : next.execution_phase === "FINALIZATION" ? "CERTIFICATION" : "SEQUENTIAL",
      resolution_status: "SATISFIED",
      lineage_refs: event.lineage_refs,
    };
    return Object.freeze({ ...base, integrity_hash: dependencyHash(base) });
  }));
}

function ledgerHash(entry: Omit<TraceLedgerEntry, "integrity_hash"> | TraceLedgerEntry): string {
  return hashWithoutIntegrity(entry);
}

function buildLedger(identity: TraceIdentity, events: readonly TraceEvent[], scenario: TraceScenario): readonly TraceLedgerEntry[] {
  const source = scenario === "LEDGER_FAILURE" ? events.slice(0, -1) : events;
  return freezeArray(source.map((event, index) => {
    const base: Omit<TraceLedgerEntry, "integrity_hash"> = {
      ledger_entry_id: `trace_ledger_${String(index + 1).padStart(2, "0")}_${event.event_id}`,
      trace_id: identity.trace_id,
      event_id: event.event_id,
      sequence: index + 1,
      event_integrity_hash: event.integrity_hash,
      append_only: true,
      deleted: false,
    };
    return Object.freeze({ ...base, integrity_hash: ledgerHash(base) });
  }));
}

function refsValid(refs: readonly DecisionReplayArtifactRef[], identity: TraceIdentity): boolean {
  return refs.length > 0 && refs.every((ref) => ref.ref_id && ref.lineage_ref && ref.immutable && ref.tenant_id === identity.tenant_id && ref.orchestration_id === identity.orchestration_id);
}

function traceRecordHash(record: Omit<OrchestrationTraceRecord, "integrity_hash"> | OrchestrationTraceRecord): string {
  return hash({
    trace_id: record.trace_id,
    orchestration_id: record.orchestration_id,
    mission_id: record.mission_id,
    tenant_id: record.tenant_id,
    trace_version: record.trace_version,
    schema_version: record.schema_version,
    trace_state: record.trace_state,
    timeline_hash: record.execution_timeline.integrity_hash,
    event_hashes: record.trace_events.map((event) => event.integrity_hash),
    dependency_hashes: record.dependency_trace.map((dependency) => dependency.integrity_hash),
    lineage_refs: record.lineage_refs,
    replay_refs: record.replay_refs,
  });
}

function buildTraceRecord(identity: TraceIdentity, timeline: TimelineRecord, events: readonly TraceEvent[], dependencies: readonly DependencyTraceRecord[], scenario: TraceScenario): OrchestrationTraceRecord {
  const base: Omit<OrchestrationTraceRecord, "integrity_hash"> = {
    trace_id: identity.trace_id,
    orchestration_id: identity.orchestration_id,
    mission_id: identity.mission_id,
    tenant_id: identity.tenant_id,
    trace_version: TRACE_VERSION,
    schema_version: scenario === "UNSUPPORTED_SCHEMA" ? "decision-orchestration-trace-schema/v999" as typeof TRACE_SCHEMA_VERSION : TRACE_SCHEMA_VERSION,
    trace_state: "AVAILABLE_FOR_REPLAY",
    execution_timeline: timeline,
    trace_events: events,
    dependency_trace: dependencies,
    lineage_refs: freezeArray(events.flatMap((event) => event.lineage_refs)),
    replay_refs: freezeArray(events.flatMap((event) => event.replay_refs)),
    governance_refs: freezeArray(events.flatMap((event) => event.governance_refs)),
    constitutional_refs: freezeArray(events.flatMap((event) => event.constitutional_refs)),
    validation_status: "VALID",
  };
  return Object.freeze({ ...base, integrity_hash: traceRecordHash(base) });
}

function visualizationHash(model: Omit<TraceVisualizationModel, "integrity_hash"> | TraceVisualizationModel): string {
  return hashWithoutIntegrity(model);
}

function buildVisualization(identity: TraceIdentity, events: readonly TraceEvent[], dependencies: readonly DependencyTraceRecord[]): TraceVisualizationModel {
  const base: Omit<TraceVisualizationModel, "integrity_hash"> = {
    mission: identity.mission_id,
    orchestration: identity.orchestration_id,
    execution_phases: freezeArray(events.map((event) => event.execution_phase)),
    events: freezeArray(events.map((event) => event.event_id)),
    dependencies: freezeArray(dependencies.map((dependency) => dependency.dependency_trace_id)),
    governance: freezeArray(events.filter((event) => event.execution_phase === "GOVERNANCE_VALIDATION").map((event) => event.event_id)),
    operator_actions: freezeArray(events.filter((event) => event.execution_phase === "OPERATOR_WORKFLOW").map((event) => event.event_id)),
    outcome: events.find((event) => event.execution_phase === "FINALIZATION")?.event_id ?? "",
    derived_from_trace: true,
  };
  return Object.freeze({ ...base, integrity_hash: visualizationHash(base) });
}

function collectFailures(input: {
  identity: TraceIdentity;
  trace: OrchestrationTraceRecord;
  events: readonly TraceEvent[];
  dependencies: readonly DependencyTraceRecord[];
  ledger: readonly TraceLedgerEntry[];
}): readonly OrchestrationTraceFailure[] {
  const failures: OrchestrationTraceFailure[] = [];
  const eventTypes = new Set(input.events.map((event) => event.event_type));
  if (REQUIRED_TRACE_EVENT_TYPES.some((type) => !eventTypes.has(type))) failures.push("EXECUTION_STAGE_MISSING");
  const sequences = input.events.map((event) => event.sequence_number);
  if (new Set(sequences).size !== sequences.length) failures.push("DUPLICATE_SEQUENCE");
  if (!sequences.every((sequence, index) => sequence === index + 1)) failures.push("EVENT_ORDERING_INVALID");
  if (input.events.some((event) => !ORCHESTRATION_EXECUTION_PHASES.includes(event.execution_phase))) failures.push("UNKNOWN_EXECUTION_PHASE");
  if (input.trace.schema_version !== TRACE_SCHEMA_VERSION) failures.push("UNSUPPORTED_SCHEMA");
  if (input.events.some((event) => !refsValid(event.lineage_refs, input.identity))) failures.push("INCOMPLETE_LINEAGE");
  if (input.events.some((event) => !refsValid(event.replay_refs, input.identity))) failures.push("REPLAY_REFS_MISSING");
  if (input.events.some((event) => !refsValid(event.governance_refs, input.identity))) failures.push("GOVERNANCE_REFS_MISSING");
  if (input.events.some((event) => !refsValid(event.constitutional_refs, input.identity))) failures.push("CONSTITUTIONAL_REFS_MISSING");
  if (input.events.some((event) => event.lineage_refs.some((ref) => ref.tenant_id !== input.identity.tenant_id))) failures.push("TENANT_MISMATCH");
  if (input.events.some((event) => event.lineage_refs.some((ref) => ref.orchestration_id !== input.identity.orchestration_id))) failures.push("ORCHESTRATION_MISMATCH");
  if (input.events.some((event) => computeTraceEventIntegrityHash(event) !== event.integrity_hash) || traceRecordHash(input.trace) !== input.trace.integrity_hash) failures.push("INTEGRITY_MISMATCH");
  if (input.events.some((event) => !event.event_id || !event.event_payload_ref || !event.snapshot_ref)) failures.push("TRACE_CORRUPTION");
  const eventIds = new Set(input.events.map((event) => event.event_id));
  if (input.dependencies.some((dependency) => dependency.resolution_status !== "SATISFIED" || !eventIds.has(dependency.source_event) || !eventIds.has(dependency.target_event) || dependencyHash(dependency) !== dependency.integrity_hash)) failures.push("DEPENDENCY_INCONSISTENCY");
  if (input.ledger.length !== input.events.length || input.ledger.some((entry, index) => !entry.append_only || entry.deleted || entry.sequence !== index + 1 || ledgerHash(entry) !== entry.integrity_hash)) failures.push("LEDGER_COMMIT_FAILURE");
  return freezeArray([...new Set(failures)]);
}

function validationHash(validation: Omit<OrchestrationTraceValidation, "integrity_hash"> | OrchestrationTraceValidation): string {
  return hashWithoutIntegrity(validation);
}

function buildValidation(identity: TraceIdentity, failures: readonly OrchestrationTraceFailure[]): OrchestrationTraceValidation {
  const has = (failure: OrchestrationTraceFailure) => failures.includes(failure);
  const base: Omit<OrchestrationTraceValidation, "integrity_hash"> = {
    validation_id: `trace_validation_${identity.trace_id}`,
    trace_id: identity.trace_id,
    validation_status: failures.length ? "BLOCKED" : "VALID",
    event_ordering_valid: !has("EVENT_ORDERING_INVALID") && !has("DUPLICATE_SEQUENCE"),
    sequence_continuity_valid: !has("EVENT_ORDERING_INVALID") && !has("DUPLICATE_SEQUENCE"),
    lineage_complete: !has("INCOMPLETE_LINEAGE"),
    dependency_consistency_valid: !has("DEPENDENCY_INCONSISTENCY"),
    governance_refs_present: !has("GOVERNANCE_REFS_MISSING"),
    constitutional_refs_present: !has("CONSTITUTIONAL_REFS_MISSING"),
    replay_refs_present: !has("REPLAY_REFS_MISSING"),
    integrity_hashes_reproducible: !has("INTEGRITY_MISMATCH") && !has("TRACE_CORRUPTION"),
    tenant_ownership_valid: !has("TENANT_MISMATCH"),
    orchestration_ownership_valid: !has("ORCHESTRATION_MISMATCH"),
    ledger_append_only: !has("LEDGER_COMMIT_FAILURE"),
    replay_ready: failures.length === 0,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: validationHash(base) });
}

export function buildDecisionOrchestrationTrace(input: BuildInput = {}): OrchestrationTraceBuilderResult {
  const snapshot_capture = input.snapshot_capture ?? captureDecisionReplaySnapshots();
  const scenario = input.scenario ?? "BASELINE";
  const trace_identity = traceIdentity(snapshot_capture);
  const trace_events = buildEvents(trace_identity, snapshot_capture, scenario);
  const execution_timeline = buildTimeline(trace_identity, trace_events);
  const dependency_trace = buildDependencyTrace(trace_events, scenario);
  const trace_record = buildTraceRecord(trace_identity, execution_timeline, trace_events, dependency_trace, scenario);
  const ledger = buildLedger(trace_identity, trace_events, scenario);
  const visualization = buildVisualization(trace_identity, trace_events, dependency_trace);
  const failures = collectFailures({ identity: trace_identity, trace: trace_record, events: trace_events, dependencies: dependency_trace, ledger });
  const validation = buildValidation(trace_identity, failures);
  const base: Omit<OrchestrationTraceBuilderResult, "integrity_hash"> = {
    trace_version: BUILDER_VERSION,
    snapshot_capture,
    trace_identity,
    trace_record,
    ledger,
    visualization,
    validation,
    deterministic: true,
    advisory_only: true,
    mutates_original_orchestration: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function getDecisionOrchestrationTraceBuilderFoundation(): OrchestrationTraceBuilderFoundation {
  return Object.freeze({
    trace_version: BUILDER_VERSION,
    execution_phases: ORCHESTRATION_EXECUTION_PHASES,
    event_types: REQUIRED_TRACE_EVENT_TYPES,
    trace_states: ORCHESTRATION_TRACE_STATES,
    terminal_states: ORCHESTRATION_TRACE_TERMINAL_STATES,
    result: buildDecisionOrchestrationTrace(),
  });
}

export const DecisionOrchestrationTraceBuilder = Object.freeze({
  build: buildDecisionOrchestrationTrace,
});
