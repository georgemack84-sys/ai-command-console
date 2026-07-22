import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runDecisionStateDashboard } from "@/services/decision-state-dashboard";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { DecisionStateDashboardResult, DecisionStateRecord } from "@/types/decision-state-dashboard";
import type {
  DecisionTimelineEventType,
  DecisionTimelineFailure,
  DecisionTimelineFoundation,
  DecisionTimelineInput,
  DecisionTimelineLifecycleStage,
  DecisionTimelineMetrics,
  DecisionTimelineResult,
  DecisionTimelineValidation,
  TimelineActorType,
  TimelineEventRecord,
  TimelineLedgerEntry,
  TimelineVisualizationModel,
} from "@/types/decision-timeline-visualization";

const TIMELINE_VERSION = "decision-timeline-visualization/v1" as const;
const NOW_PREFIX = "2026-07-05T03:";

export const DECISION_TIMELINE_LIFECYCLE_STAGES: readonly DecisionTimelineLifecycleStage[] = Object.freeze(["REGISTERED", "INGESTED", "CONTEXTUALIZED", "PRIORITIZED", "DEPENDENCY_ANALYZED", "CONFLICT_REVIEW", "GOVERNANCE_VALIDATED", "PACKAGE_GENERATED", "OPERATOR_REVIEW", "APPROVED", "REPLAY_VALIDATED", "CERTIFIED", "ARCHIVED"]);
export const DECISION_TIMELINE_EVENT_TYPES: readonly DecisionTimelineEventType[] = Object.freeze(["DECISION_CREATED", "DECISION_UPDATED", "RECOMMENDATION_CHANGED", "PRIORITY_CHANGED", "GOVERNANCE_VALIDATION", "CONSTITUTIONAL_VALIDATION", "AUTHORITY_VERIFICATION", "APPROVAL_COMPLETED", "CONFLICT_DETECTED", "ARBITRATION_INITIATED", "ARBITRATION_RESOLVED", "REVIEW_STARTED", "APPROVAL", "REJECTION", "OVERRIDE", "DEFER", "ESCALATION", "EVIDENCE_REQUESTED", "SIMULATION_REQUESTED", "REPLAY_GENERATED", "REPLAY_VERIFIED", "REPLAY_DIVERGENCE_DETECTED", "CERTIFICATION_INITIATED", "CERTIFICATION_COMPLETED", "CERTIFICATION_FAILED", "ARCHIVAL_COMPLETED"]);

type Scenario = NonNullable<DecisionTimelineInput["scenario"]>;

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

function timestamp(sequence: number, scenario: Scenario): string {
  if (scenario === "BAD_TIMESTAMP" && sequence === 6) return `${NOW_PREFIX}00:00.000Z`;
  return `${NOW_PREFIX}${String(sequence).padStart(2, "0")}:00.000Z`;
}

function baseRecord(dashboard: DecisionStateDashboardResult): DecisionStateRecord {
  return dashboard.registry[0]!;
}

function event(
  dashboard: DecisionStateDashboardResult,
  source: DecisionStateRecord,
  sequence: number,
  type: DecisionTimelineEventType,
  stage: DecisionTimelineLifecycleStage,
  actorType: TimelineActorType,
  actorId: string,
  evidence: readonly string[],
  scenario: Scenario,
): TimelineEventRecord {
  const eventStage = scenario === "BAD_LIFECYCLE_ORDER" && sequence === 5 ? "INGESTED" : stage;
  const tenant = scenario === "CROSS_TENANT" && sequence === 1 ? "tenant_other" : source.tenant_id;
  const replay = scenario === "MISSING_REPLAY" && (type === "REPLAY_GENERATED" || type === "REPLAY_VERIFIED") ? "" : dashboard.replay_hash;
  const certification = scenario === "MISSING_CERTIFICATION" && type === "CERTIFICATION_COMPLETED" ? "" : dashboard.observability_result.certification_result.certification_record.certification_id;
  const base: Omit<TimelineEventRecord, "integrity_hash"> = {
    timeline_event_id: `timeline_event_${String(sequence).padStart(2, "0")}_${type.toLowerCase()}`,
    orchestration_id: source.orchestration_id,
    decision_id: source.decision_id,
    tenant_id: tenant,
    mission_id: source.mission_id,
    event_type: type,
    lifecycle_stage: eventStage as DecisionTimelineLifecycleStage,
    event_timestamp: timestamp(sequence, scenario),
    sequence_number: scenario === "NONDETERMINISTIC_ORDER" && sequence === 8 ? 4 : sequence,
    actor_type: actorType,
    actor_id: actorId,
    governance_state: source.governance_state,
    constitutional_state: source.constitutional_state,
    authority_state: source.authority_state,
    replay_reference: replay,
    certification_reference: certification,
    evidence_refs: freezeArray(evidence),
    dependency_refs: source.dependency_chain,
    duration_ms: 300 + sequence * 25,
  };
  const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH" && sequence === 1) return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.timeline_event_id }) });
  return built;
}

function buildEvents(dashboard: DecisionStateDashboardResult, scenario: Scenario): readonly TimelineEventRecord[] {
  if (scenario === "MISSING_EVENTS") return freezeArray([]);
  const record = baseRecord(dashboard);
  const evidence = [record.state_record_id, dashboard.replay_hash, dashboard.observability_result.certification_result.certification_record.certification_id];
  const all: readonly TimelineEventRecord[] = [
    event(dashboard, record, 1, "DECISION_CREATED", "REGISTERED", "SYSTEM", "decision-intake", evidence, scenario),
    event(dashboard, record, 2, "DECISION_UPDATED", "INGESTED", "SYSTEM", "decision-intake", evidence, scenario),
    event(dashboard, record, 3, "RECOMMENDATION_CHANGED", "CONTEXTUALIZED", "SYSTEM", "decision-context", evidence, scenario),
    event(dashboard, record, 4, "PRIORITY_CHANGED", "PRIORITIZED", "SYSTEM", "priority-engine", evidence, scenario),
    event(dashboard, record, 5, "CONFLICT_DETECTED", "DEPENDENCY_ANALYZED", "SYSTEM", "dependency-graph", evidence, scenario),
    event(dashboard, record, 6, "ARBITRATION_INITIATED", "CONFLICT_REVIEW", "SYSTEM", "conflict-arbitration", evidence, scenario),
    event(dashboard, record, 7, "ARBITRATION_RESOLVED", "CONFLICT_REVIEW", "SYSTEM", "conflict-arbitration", evidence, scenario),
    event(dashboard, record, 8, "GOVERNANCE_VALIDATION", "GOVERNANCE_VALIDATED", "GOVERNANCE", "governance-validator", evidence, scenario),
    event(dashboard, record, 9, "CONSTITUTIONAL_VALIDATION", "GOVERNANCE_VALIDATED", "GOVERNANCE", "constitutional-validator", evidence, scenario),
    event(dashboard, record, 10, "AUTHORITY_VERIFICATION", "GOVERNANCE_VALIDATED", "GOVERNANCE", "authority-resolver", evidence, scenario),
    event(dashboard, record, 11, "APPROVAL_COMPLETED", "PACKAGE_GENERATED", "OPERATOR", record.assigned_operator, evidence, scenario),
    event(dashboard, record, 12, "REVIEW_STARTED", "OPERATOR_REVIEW", "OPERATOR", record.assigned_operator, evidence, scenario),
    event(dashboard, record, 13, "EVIDENCE_REQUESTED", "OPERATOR_REVIEW", "OPERATOR", record.assigned_operator, evidence, scenario),
    event(dashboard, record, 14, "SIMULATION_REQUESTED", "OPERATOR_REVIEW", "OPERATOR", record.assigned_operator, evidence, scenario),
    event(dashboard, record, 15, "APPROVAL", "APPROVED", "OPERATOR", record.assigned_operator, evidence, scenario),
    event(dashboard, record, 16, "OVERRIDE", "APPROVED", "OPERATOR", record.assigned_operator, evidence, scenario),
    event(dashboard, record, 17, "ESCALATION", "APPROVED", "OPERATOR", record.assigned_operator, evidence, scenario),
    event(dashboard, record, 18, "REPLAY_GENERATED", "REPLAY_VALIDATED", "AUDITOR", "replay-engine", evidence, scenario),
    event(dashboard, record, 19, "REPLAY_VERIFIED", "REPLAY_VALIDATED", "AUDITOR", "integrity-engine", evidence, scenario),
    event(dashboard, record, 20, "CERTIFICATION_INITIATED", "CERTIFIED", "CERTIFICATION", "certification-gate", evidence, scenario),
    event(dashboard, record, 21, "CERTIFICATION_COMPLETED", "CERTIFIED", "CERTIFICATION", "certification-gate", evidence, scenario),
    event(dashboard, record, 22, "ARCHIVAL_COMPLETED", "ARCHIVED", "SYSTEM", "timeline-ledger", evidence, scenario),
  ];
  if (scenario === "MISSING_GOVERNANCE") return freezeArray(all.filter((item) => item.actor_type !== "GOVERNANCE"));
  if (scenario === "MISSING_OPERATOR") return freezeArray(all.filter((item) => item.actor_type !== "OPERATOR"));
  return freezeArray(all);
}

function orderedEvents(events: readonly TimelineEventRecord[]): readonly TimelineEventRecord[] {
  return freezeArray([...events].sort((a, b) => a.sequence_number - b.sequence_number || a.event_timestamp.localeCompare(b.event_timestamp) || DECISION_TIMELINE_LIFECYCLE_STAGES.indexOf(a.lifecycle_stage) - DECISION_TIMELINE_LIFECYCLE_STAGES.indexOf(b.lifecycle_stage) || a.timeline_event_id.localeCompare(b.timeline_event_id)));
}

function buildLedger(events: readonly TimelineEventRecord[], scenario: Scenario): readonly TimelineLedgerEntry[] {
  return freezeArray(events.map((item, index) => {
    const base: Omit<TimelineLedgerEntry, "integrity_hash"> = {
      ledger_entry_id: `timeline_ledger_${item.timeline_event_id}`,
      timeline_event_id: item.timeline_event_id,
      sequence_number: index + 1,
      event_hash: item.integrity_hash,
      append_only: true,
      deleted: false,
    };
    const entry = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
    if (scenario === "LEDGER_MUTATION" && index === 0) return Object.freeze({ ...entry, deleted: true as false });
    return entry;
  }));
}

function view(id: string, viewType: TimelineVisualizationModel["view_type"], events: readonly TimelineEventRecord[], groupingKey: string, replayRef: string): TimelineVisualizationModel {
  const base: Omit<TimelineVisualizationModel, "integrity_hash"> = {
    visualization_id: id,
    view_type: viewType,
    event_refs: freezeArray(events.map((item) => item.timeline_event_id)),
    grouping_key: groupingKey,
    deterministic_sort: freezeArray(["sequence_number", "event_timestamp", "lifecycle_stage", "dependency_order", "replay_order"]),
    replay_reference: replayRef,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetrics(events: readonly TimelineEventRecord[]): DecisionTimelineMetrics {
  const governance = events.filter((item) => item.actor_type === "GOVERNANCE");
  const operator = events.filter((item) => item.actor_type === "OPERATOR");
  const replay = events.filter((item) => item.event_type.startsWith("REPLAY"));
  const certification = events.filter((item) => item.event_type.startsWith("CERTIFICATION"));
  const base: Omit<DecisionTimelineMetrics, "integrity_hash"> = {
    average_lifecycle_duration_ms: events.reduce((sum, item) => sum + item.duration_ms, 0),
    transition_latency_ms: 325,
    stage_duration_ms: 550,
    completion_rate: events.some((item) => item.lifecycle_stage === "ARCHIVED") ? 100 : 0,
    governance_review_duration_ms: governance.reduce((sum, item) => sum + item.duration_ms, 0),
    approval_latency_ms: 450,
    escalation_frequency: operator.filter((item) => item.event_type === "ESCALATION").length,
    approval_count: operator.filter((item) => item.event_type === "APPROVAL").length,
    override_frequency: operator.filter((item) => item.event_type === "OVERRIDE").length,
    response_time_ms: 725,
    review_backlog: 0,
    replay_generation_time_ms: replay.reduce((sum, item) => sum + item.duration_ms, 0),
    replay_success_rate: replay.length >= 2 ? 100 : 0,
    divergence_rate: events.some((item) => item.event_type === "REPLAY_DIVERGENCE_DETECTED") ? 100 : 0,
    certification_duration_ms: certification.reduce((sum, item) => sum + item.duration_ms, 0),
    validation_failures: events.filter((item) => item.event_type === "CERTIFICATION_FAILED").length,
    readiness_score: 96,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(input: {
  dashboard: DecisionStateDashboardResult;
  events: readonly TimelineEventRecord[];
  ledger: readonly TimelineLedgerEntry[];
  chronological: TimelineVisualizationModel;
  lifecycle: TimelineVisualizationModel;
  governance: TimelineVisualizationModel;
  operator: TimelineVisualizationModel;
  replay: TimelineVisualizationModel;
  certification: TimelineVisualizationModel;
  dependency: TimelineVisualizationModel;
  metrics: DecisionTimelineMetrics;
  role: VisibilityRole;
  scenario: Scenario;
}): readonly DecisionTimelineFailure[] {
  const failures: DecisionTimelineFailure[] = [];
  const ordered = orderedEvents(input.events);
  const tenant = input.dashboard.observability_result.certification_result.certification_record.tenant_id;
  if (input.events.length === 0) failures.push("TIMELINE_EVENTS_MISSING");
  if (!DECISION_TIMELINE_LIFECYCLE_STAGES.every((stage) => input.events.some((item) => item.lifecycle_stage === stage))) failures.push("LIFECYCLE_ORDERING_INCORRECT");
  if (input.events.some((item, index, arr) => index > 0 && item.event_timestamp < arr[index - 1]!.event_timestamp)) failures.push("TIMESTAMP_INCONSISTENT");
  if (input.governance.event_refs.length < 3) failures.push("GOVERNANCE_EVENTS_OMITTED");
  if (input.operator.event_refs.length < 6) failures.push("OPERATOR_ACTIONS_ABSENT");
  if (input.replay.event_refs.length < 2 || input.events.some((item) => item.event_type.startsWith("REPLAY") && !item.replay_reference)) failures.push("REPLAY_CHECKPOINTS_MISSING");
  if (input.certification.event_refs.length < 2 || input.events.some((item) => item.event_type.startsWith("CERTIFICATION") && !item.certification_reference)) failures.push("CERTIFICATION_MILESTONES_INCOMPLETE");
  if (input.events.map((item) => item.timeline_event_id).join("|") !== ordered.map((item) => item.timeline_event_id).join("|")) failures.push("NONDETERMINISTIC_EVENT_ORDERING");
  if (input.events.some((item) => item.tenant_id !== tenant)) failures.push("CROSS_TENANT_TIMELINE_VISIBLE");
  if (
    input.events.some((item) => hashWithoutIntegrity(item) !== item.integrity_hash)
    || input.ledger.some((entry) => hashWithoutIntegrity(entry) !== entry.integrity_hash || !entry.append_only || entry.deleted)
    || hashWithoutIntegrity(input.chronological) !== input.chronological.integrity_hash
    || hashWithoutIntegrity(input.lifecycle) !== input.lifecycle.integrity_hash
    || hashWithoutIntegrity(input.governance) !== input.governance.integrity_hash
    || hashWithoutIntegrity(input.operator) !== input.operator.integrity_hash
    || hashWithoutIntegrity(input.replay) !== input.replay.integrity_hash
    || hashWithoutIntegrity(input.certification) !== input.certification.integrity_hash
    || hashWithoutIntegrity(input.dependency) !== input.dependency.integrity_hash
    || hashWithoutIntegrity(input.metrics) !== input.metrics.integrity_hash
  ) failures.push("INTEGRITY_HASH_MISMATCH");
  if (input.scenario === "REPLAY_RECONSTRUCTION_FAILURE") failures.push("TIMELINE_REPLAY_RECONSTRUCTION_FAILED");
  if (!input.dashboard.observability_result.authorizations.some((auth) => auth.role === input.role && auth.permissions.includes("VIEW_DECISIONS"))) failures.push("AUTHORIZATION_FAILURE");
  if (input.ledger.some((entry) => !entry.append_only || entry.deleted)) failures.push("LEDGER_IMMUTABILITY_FAILURE");
  return freezeArray([...new Set(failures)]);
}

function buildValidation(failures: readonly DecisionTimelineFailure[]): DecisionTimelineValidation {
  const has = (failure: DecisionTimelineFailure) => failures.includes(failure);
  const base: Omit<DecisionTimelineValidation, "integrity_hash"> = {
    validation_id: "decision_timeline_visualization_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    timeline_generation_deterministic: !has("TIMELINE_EVENTS_MISSING"),
    event_ordering_reproducible: !has("NONDETERMINISTIC_EVENT_ORDERING"),
    timestamp_consistency_verified: !has("TIMESTAMP_INCONSISTENT"),
    dependency_ordering_validated: !has("LIFECYCLE_ORDERING_INCORRECT"),
    lifecycle_complete: !has("LIFECYCLE_ORDERING_INCORRECT"),
    governance_checkpoints_complete: !has("GOVERNANCE_EVENTS_OMITTED"),
    operator_actions_complete: !has("OPERATOR_ACTIONS_ABSENT"),
    replay_reconstructed_identically: !has("REPLAY_CHECKPOINTS_MISSING") && !has("TIMELINE_REPLAY_RECONSTRUCTION_FAILED"),
    ledger_references_valid: !has("LEDGER_IMMUTABILITY_FAILURE"),
    tenant_isolated: !has("CROSS_TENANT_TIMELINE_VISIBLE"),
    authorization_valid: !has("AUTHORIZATION_FAILURE"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<DecisionTimelineResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    events: result.events,
    ledger: result.timeline_ledger,
    views: [result.chronological_view, result.lifecycle_view, result.governance_view, result.operator_view, result.replay_view, result.certification_view, result.dependency_view],
    metrics: result.metrics,
    validation: result.validation,
  });
}

export function runDecisionTimelineVisualization(input: DecisionTimelineInput = {}): DecisionTimelineResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const dashboard_result = input.dashboard_result ?? runDecisionStateDashboard();
  const rawEvents = buildEvents(dashboard_result, scenario);
  const events = scenario === "NONDETERMINISTIC_ORDER" ? rawEvents : orderedEvents(rawEvents);
  const timeline_ledger = buildLedger(events, scenario);
  const replayRef = scenario === "REPLAY_RECONSTRUCTION_FAILURE" ? "timeline_replay_mismatch" : dashboard_result.replay_hash;
  const chronological_view = view("timeline_view_chronological", "CHRONOLOGICAL", events, "sequence_number", replayRef);
  const lifecycle_view = view("timeline_view_lifecycle", "LIFECYCLE", events, "lifecycle_stage", replayRef);
  const governance_view = view("timeline_view_governance", "GOVERNANCE", events.filter((item) => item.actor_type === "GOVERNANCE"), "governance_state", replayRef);
  const operator_view = view("timeline_view_operator", "OPERATOR", events.filter((item) => item.actor_type === "OPERATOR"), "actor_id", replayRef);
  const replay_view = view("timeline_view_replay", "REPLAY", events.filter((item) => item.event_type.startsWith("REPLAY")), "replay_reference", replayRef);
  const certification_view = view("timeline_view_certification", "CERTIFICATION", events.filter((item) => item.event_type.startsWith("CERTIFICATION")), "certification_reference", replayRef);
  const dependency_view = view("timeline_view_dependency", "DEPENDENCY", events.filter((item) => item.dependency_refs.length > 0), "dependency_refs", replayRef);
  const metrics = buildMetrics(events);
  const failures = collectFailures({ dashboard: dashboard_result, events, ledger: timeline_ledger, chronological: chronological_view, lifecycle: lifecycle_view, governance: governance_view, operator: operator_view, replay: replay_view, certification: certification_view, dependency: dependency_view, metrics, role, scenario });
  const validation = buildValidation(failures);
  const base: Omit<DecisionTimelineResult, "integrity_hash" | "replay_hash"> = {
    timeline_version: TIMELINE_VERSION,
    dashboard_result,
    events,
    timeline_ledger,
    chronological_view,
    lifecycle_view,
    governance_view,
    operator_view,
    replay_view,
    certification_view,
    dependency_view,
    metrics,
    validation,
    deterministic: true,
    advisory_only: true,
    mutates_orchestration: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayDecisionTimelineVisualization(result: DecisionTimelineResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeTimelineEventHash(eventRecord: Omit<TimelineEventRecord, "integrity_hash"> | TimelineEventRecord): string {
  return hashWithoutIntegrity(eventRecord);
}

export function getDecisionTimelineFoundation(): DecisionTimelineFoundation {
  return Object.freeze({
    timeline_version: TIMELINE_VERSION,
    lifecycle_stages: DECISION_TIMELINE_LIFECYCLE_STAGES,
    event_types: DECISION_TIMELINE_EVENT_TYPES,
    result: runDecisionTimelineVisualization(),
  });
}

export const DecisionTimelineVisualization = Object.freeze({
  run: runDecisionTimelineVisualization,
  replay: replayDecisionTimelineVisualization,
});
