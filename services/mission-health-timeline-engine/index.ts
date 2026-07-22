import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { scoreMissionHealth } from "@/services/mission-health-scoring-engine";
import type { MissionSubsystemId } from "@/types/mission-health-contract";
import type { MissionHealthScore } from "@/types/mission-health-scoring-engine";
import type {
  DegradationTimelineEvent,
  MissionHealthTimeline,
  MissionHealthTimelineEngineContract,
  MissionHealthTimelineEntry,
  MissionHealthTimelineFailure,
  MissionHealthTimelineInput,
  MissionHealthTimelineObservabilitySurface,
  MissionHealthTimelineReplayResult,
  MissionHealthTimelineScenario,
  MissionHealthTimelineValidationResult,
  OperatorAcknowledgement,
  SubsystemHealthSnapshot,
  TimelineEventType,
} from "@/types/mission-health-timeline-engine";
import type { MissionTrendState } from "@/types/mission-trend-intelligence-engine";

const NOW = "2026-07-13T05:00:00.000Z";
const VERSION = "mission-health-timeline-engine/v8ALT.4.5" as const;
const TIMELINE_VERSION = "mission-health-timeline/v8ALT.4.5" as const;
const TENANT_ID = "tenant:autonomy:primary";
const subsystemIds = Object.freeze(["planning", "orchestration", "delegation", "runtime_supervision", "governance", "replay", "integrity", "authority"] as const);
const states = Object.freeze(["INITIALIZED", "RECORDING", "VALIDATING", "LINKING_EVIDENCE", "HASHING", "COMMITTED", "REPLAY_AVAILABLE", "ARCHIVED", "REJECTED"] as const);
const eventTypes = Object.freeze(["HEALTH_UPDATE", "SCORE_CHANGE", "TREND_CHANGE", "CONFIDENCE_CHANGE", "DEGRADATION_EVENT", "RECOVERY_EVENT", "OPERATOR_EVENT", "CERTIFICATION_EVENT", "GOVERNANCE_EVENT", "AUDIT_EVENT"] as const);
const ackTypes = Object.freeze(["VIEWED", "ACKNOWLEDGED", "ESCALATED", "REVIEW_REQUESTED", "MONITORING_CONTINUES", "NO_ACTION_REQUIRED"] as const);
const degradationTypes = Object.freeze(["HEALTH_DECLINE", "CONFIDENCE_DROP", "STABILITY_LOSS", "REPLAY_DEGRADATION", "INTEGRITY_WARNING", "AUTHORITY_VIOLATION", "GOVERNANCE_VIOLATION", "RECOVERY_STARTED", "RECOVERY_COMPLETED", "MISSION_FAILURE"] as const);
const confidenceLevels = Object.freeze(["VERY_HIGH", "HIGH", "MEDIUM", "LOW", "VERY_LOW", "INSUFFICIENT"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function round(value: number): number { return Number(value.toFixed(4)); }

function failuresFor(scenario: MissionHealthTimelineScenario): readonly MissionHealthTimelineFailure[] {
  const map: Partial<Record<MissionHealthTimelineScenario, MissionHealthTimelineFailure>> = {
    DUPLICATE_ENTRY: "DUPLICATE_ENTRY_DETECTED",
    INVALID_SCORE: "SCORE_INVALID",
    INVALID_CONFIDENCE: "CONFIDENCE_INVALID",
    BROKEN_LINEAGE: "LINEAGE_BROKEN",
    MISSING_EVIDENCE: "EVIDENCE_MISSING",
    MISSING_REPLAY_REFERENCE: "REPLAY_REFERENCE_MISSING",
    HASH_MISMATCH: "HASH_CHAIN_INVALID",
    TIMESTAMP_INCONSISTENCY: "TIMESTAMP_INCONSISTENT",
    REORDER_ATTEMPT: "TIMELINE_ORDER_INVALID",
    DELETE_ATTEMPT: "DELETE_ATTEMPT_DETECTED",
    HISTORY_MUTATION_ATTEMPT: "IMMUTABLE_HISTORY_VIOLATION",
    GOVERNANCE_VIOLATION: "GOVERNANCE_INVALID",
    AUTHORITY_VIOLATION: "AUTHORITY_INVALID",
    TENANT_VIOLATION: "TENANT_ISOLATION_INVALID",
    AUTONOMOUS_EXECUTION_ATTEMPT: "ADVISORY_ONLY_VIOLATION",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function sourceScores(input: MissionHealthTimelineInput, failures: readonly MissionHealthTimelineFailure[]): readonly MissionHealthScore[] {
  if (input.scores) return input.scores;
  const tenant_id = failures.includes("TENANT_ISOLATION_INVALID") ? "external-tenant" : input.tenant_id ?? TENANT_ID;
  const mission_id = input.mission_id ?? "mission:health:primary";
  return freezeArray([0, 1, 2, 3, 4].map((index) => scoreMissionHealth({ tenant_id, mission_id: `${mission_id}:timeline:${index}` })));
}

function snapshot(score: MissionHealthScore, failures: readonly MissionHealthTimelineFailure[]): SubsystemHealthSnapshot {
  const entries = subsystemIds.map((subsystem) => {
    const record = score.source_collection.subsystems.find((item) => item.subsystem_id === subsystem);
    return [subsystem, Object.freeze({
      health_score: record?.health_score ?? 0,
      confidence: failures.includes("CONFIDENCE_INVALID") && subsystem === "planning" ? 1.4 : record?.confidence ?? 0,
      stability: record?.stability_score ?? 0,
      status: record?.health_state ?? "UNKNOWN",
      degradation_state: record?.degradation_state ?? "UNKNOWN",
      evidence_reference: failures.includes("EVIDENCE_MISSING") ? "" : record?.evidence_reference ?? "",
    })];
  });
  return Object.freeze(Object.fromEntries(entries) as Record<MissionSubsystemId, SubsystemHealthSnapshot[MissionSubsystemId]>);
}

function acknowledgement(timelineId: string, sequence: number, failures: readonly MissionHealthTimelineFailure[]): OperatorAcknowledgement | null {
  if (sequence % 2 !== 0) return null;
  const acknowledgement_id = id("MHTA", "mission-health-timeline-ack", { timelineId, sequence });
  const base = {
    acknowledgement_id,
    operator_id: "operator:mission-health:primary",
    acknowledgement_type: sequence === 2 ? "ACKNOWLEDGED" as const : "MONITORING_CONTINUES" as const,
    timestamp: `2026-07-13T0${sequence}:30:00.000Z`,
    associated_health_event: `event:${timelineId}:${sequence}`,
    notes: "Recorded for deterministic operator visibility.",
    replay_reference: failures.includes("REPLAY_REFERENCE_MISSING") ? "" : `replay:mission-health-timeline-ack:${acknowledgement_id}`,
  };
  return Object.freeze({ ...base, acknowledgement_hash: hashValue("mission-health-timeline-ack", base) });
}

function degradationEvent(timelineId: string, sequence: number, score: MissionHealthScore, failures: readonly MissionHealthTimelineFailure[]): DegradationTimelineEvent | null {
  if (sequence !== 3 && score.overall_health_score >= 80) return null;
  const event_id = id("MHTD", "mission-health-timeline-degradation", { timelineId, sequence });
  const base = {
    event_id,
    event_type: sequence === 3 ? "HEALTH_DECLINE" as const : "CONFIDENCE_DROP" as const,
    severity: score.degradation_severity,
    affected_subsystem: "mission" as const,
    evidence_reference: failures.includes("EVIDENCE_MISSING") ? "" : `evidence:mission-health-timeline-event:${event_id}`,
    timestamp: `2026-07-13T0${sequence}:15:00.000Z`,
    replay_reference: failures.includes("REPLAY_REFERENCE_MISSING") ? "" : `replay:mission-health-timeline-event:${event_id}`,
    operator_visible: true as const,
  };
  return Object.freeze({ ...base, event_hash: hashValue("mission-health-timeline-degradation-event", base) });
}

function trendFor(sequence: number): MissionTrendState {
  return sequence <= 2 ? "STABLE" : sequence === 3 ? "DEGRADING" : "RECOVERING";
}

function computeEntryHash(entry: Omit<MissionHealthTimelineEntry, "entry_hash" | "timeline_hash"> | MissionHealthTimelineEntry): string {
  const { entry_hash: _entry, timeline_hash: _timeline, ...source } = entry as MissionHealthTimelineEntry;
  return hashValue("mission-health-timeline-entry", source);
}

function entry(timelineId: string, score: MissionHealthScore, sequence: number, previousHash: string, failures: readonly MissionHealthTimelineFailure[]): MissionHealthTimelineEntry {
  const event_type: TimelineEventType = sequence === 1 ? "HEALTH_UPDATE" : sequence === 3 ? "DEGRADATION_EVENT" : sequence === 4 ? "OPERATOR_EVENT" : "SCORE_CHANGE";
  const timestamp = failures.includes("TIMESTAMP_INCONSISTENT") && sequence === 4 ? "2026-07-13T01:00:00.000Z" : `2026-07-13T0${sequence}:00:00.000Z`;
  const entry_id = id("MHTE", "mission-health-timeline-entry", { timelineId, sequence, score: score.mission_health_score_id });
  const deg = degradationEvent(timelineId, sequence, score, failures);
  const ack = acknowledgement(timelineId, sequence, failures);
  const base = {
    entry_id,
    timeline_id: timelineId,
    sequence,
    previous_hash: failures.includes("HASH_CHAIN_INVALID") && sequence === 3 ? "tampered-previous-hash" : previousHash,
    mission_health_score_id: score.mission_health_score_id,
    mission_id: score.mission_id,
    tenant_id: failures.includes("TENANT_ISOLATION_INVALID") ? "external-tenant" : score.tenant_id,
    timestamp,
    health_state: score.health_state,
    overall_health_score: failures.includes("SCORE_INVALID") && sequence === 2 ? 130 : score.overall_health_score,
    overall_confidence: failures.includes("CONFIDENCE_INVALID") && sequence === 2 ? 1.4 : score.overall_confidence.overall_confidence,
    readiness_score: score.readiness_score,
    stability_index: score.stability_index,
    trend_state: trendFor(sequence),
    degradation_state: score.degradation_severity,
    subsystem_snapshot: snapshot(score, failures),
    operator_acknowledgement: ack,
    degradation_event: deg,
    event_type,
    event_reference: `event:mission-health-timeline:${timelineId}:${sequence}`,
    evidence_reference: failures.includes("EVIDENCE_MISSING") ? "" : `evidence:mission-health-timeline-entry:${entry_id}`,
    lineage_reference: failures.includes("LINEAGE_BROKEN") ? "" : `lineage:mission-health-timeline-entry:${entry_id}`,
    replay_reference: failures.includes("REPLAY_REFERENCE_MISSING") ? "" : `replay:mission-health-timeline-entry:${entry_id}`,
    integrity_hash: failures.includes("HASH_CHAIN_INVALID") && sequence === 3 ? "" : hashValue("mission-health-timeline-entry-integrity", { entry_id, previousHash, score: score.score_hash }),
    verification_status: failures.includes("HASH_CHAIN_INVALID") && sequence === 3 ? "FAILED" as const : "VERIFIED" as const,
    source_score: score,
  };
  const entry_hash = computeEntryHash(base as Omit<MissionHealthTimelineEntry, "entry_hash" | "timeline_hash">);
  return Object.freeze({ ...base, entry_hash, timeline_hash: hashValue("mission-health-timeline-entry-chain", { timelineId, sequence, previousHash, entry_hash }) });
}

function computeTimelineHash(timeline: Omit<MissionHealthTimeline, "timeline_hash"> | MissionHealthTimeline): string {
  const { timeline_hash: _hash, ...source } = timeline as MissionHealthTimeline;
  return hashValue("mission-health-timeline", source);
}

export function buildMissionHealthTimeline(input: MissionHealthTimelineInput = {}): MissionHealthTimeline {
  const scenario = input.scenario ?? "BASELINE";
  const failures = failuresFor(scenario);
  const scores = sourceScores(input, failures);
  const mission_id = input.mission_id ?? "mission:health:primary";
  const tenant_id = failures.includes("TENANT_ISOLATION_INVALID") ? "external-tenant" : input.tenant_id ?? TENANT_ID;
  const timeline_id = id("MHT", "mission-health-timeline", { mission_id, scenario });
  let previous = "GENESIS";
  let entries = scores.map((score, index) => {
    const item = entry(timeline_id, score, index + 1, previous, failures);
    previous = item.entry_hash;
    return item;
  });
  if (scenario === "DUPLICATE_ENTRY") entries = [...entries, entries[1]];
  if (scenario === "REORDER_ATTEMPT") entries = [...entries].reverse();
  if (scenario === "DELETE_ATTEMPT") entries = entries.slice(0, -1);
  const frozenEntries = freezeArray(entries);
  const degradation_events = freezeArray(frozenEntries.flatMap((item) => item.degradation_event ? [item.degradation_event] : []));
  const operator_acknowledgements = freezeArray(frozenEntries.flatMap((item) => item.operator_acknowledgement ? [item.operator_acknowledgement] : []));
  const base = {
    timeline_id,
    mission_id,
    tenant_id,
    timeline_version: TIMELINE_VERSION,
    timeline_state: failures.length ? "REJECTED" as const : "REPLAY_AVAILABLE" as const,
    entry_count: frozenEntries.length,
    first_entry: frozenEntries[0]?.entry_id ?? "",
    latest_entry: frozenEntries[frozenEntries.length - 1]?.entry_id ?? "",
    timeline_start: frozenEntries[0]?.timestamp ?? NOW,
    timeline_end: frozenEntries[frozenEntries.length - 1]?.timestamp ?? NOW,
    entries: frozenEntries,
    score_history: freezeArray(frozenEntries.map((item) => item.overall_health_score)),
    trend_history: freezeArray(frozenEntries.map((item) => item.trend_state)),
    confidence_history: freezeArray(frozenEntries.map((item) => item.overall_confidence)),
    degradation_events,
    operator_acknowledgements,
    integrity_hash: failures.includes("HASH_CHAIN_INVALID") ? "" : hashValue("mission-health-timeline-integrity", frozenEntries.map((item) => item.entry_hash)),
    lineage_reference: failures.includes("LINEAGE_BROKEN") ? "" : `lineage:mission-health-timeline:${timeline_id}`,
    replay_reference: failures.includes("REPLAY_REFERENCE_MISSING") ? "" : `replay:mission-health-timeline:${timeline_id}`,
    contract_version: VERSION,
    append_only: true as const,
    read_only_after_recording: true as const,
    advisory_only: true as const,
    historical_entry_modified: failures.includes("IMMUTABLE_HISTORY_VIOLATION"),
    entry_deleted: failures.includes("DELETE_ATTEMPT_DETECTED"),
    entry_reordered: failures.includes("TIMELINE_ORDER_INVALID"),
    autonomous_execution_authorized: failures.includes("ADVISORY_ONLY_VIOLATION"),
    governance_bypassed: failures.includes("GOVERNANCE_INVALID") || failures.includes("ADVISORY_ONLY_VIOLATION"),
    authority_overridden: failures.includes("AUTHORITY_INVALID") || failures.includes("ADVISORY_ONLY_VIOLATION"),
  };
  return Object.freeze({ ...base, timeline_hash: computeTimelineHash(base as Omit<MissionHealthTimeline, "timeline_hash">) });
}

export function replayMissionHealthTimeline(timeline = buildMissionHealthTimeline()): MissionHealthTimelineReplayResult {
  const reconstructed_hash = computeTimelineHash(timeline);
  const source = { replay_reference: timeline.replay_reference, timeline_id: timeline.timeline_id, deterministic: reconstructed_hash === timeline.timeline_hash && Boolean(timeline.replay_reference), reconstructed_hash, original_hash: timeline.timeline_hash };
  return Object.freeze({ ...source, replay_result_hash: hashValue("mission-health-timeline-replay", source) });
}

export function validateMissionHealthTimeline(timeline?: MissionHealthTimeline): MissionHealthTimelineValidationResult {
  if (!timeline) {
    const failures = freezeArray<MissionHealthTimelineFailure>(["TIMELINE_CONTRACT_INVALID"]);
    const source = { timeline_id: null, valid: false, timeline_contract_valid: false, unique_entries: false, score_history_valid: false, confidence_history_valid: false, deterministic_ordering: false, timestamp_consistency_valid: false, evidence_complete: false, replay_references_present: false, lineage_continuity_valid: false, hash_chain_valid: false, immutable_history_preserved: false, governance_valid: false, constitutional_valid: false, authority_valid: false, tenant_isolated: false, advisory_only_behavior_enforced: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("mission-health-timeline-validation", source) });
  }
  const ids = timeline.entries.map((item) => item.entry_id);
  const sequences = timeline.entries.map((item) => item.sequence);
  const timestamps = timeline.entries.map((item) => item.timestamp);
  const timeline_contract_valid = timeline.contract_version === VERSION && timeline.timeline_version === TIMELINE_VERSION;
  const unique_entries = new Set(ids).size === ids.length;
  const score_history_valid = timeline.entries.every((item) => item.overall_health_score >= 0 && item.overall_health_score <= 100);
  const confidence_history_valid = timeline.entries.every((item) => item.overall_confidence >= 0 && item.overall_confidence <= 1 && subsystemIds.every((subsystem) => item.subsystem_snapshot[subsystem].confidence >= 0 && item.subsystem_snapshot[subsystem].confidence <= 1));
  const deterministic_ordering = sequences.join("|") === [...sequences].sort((a, b) => a - b).join("|");
  const timestamp_consistency_valid = timestamps.join("|") === [...timestamps].sort().join("|");
  const evidence_complete = timeline.entries.every((item) => item.evidence_reference && subsystemIds.every((subsystem) => item.subsystem_snapshot[subsystem].evidence_reference) && (!item.degradation_event || item.degradation_event.evidence_reference));
  const replay_references_present = Boolean(timeline.replay_reference) && timeline.entries.every((item) => item.replay_reference && (!item.operator_acknowledgement || item.operator_acknowledgement.replay_reference) && (!item.degradation_event || item.degradation_event.replay_reference));
  const lineage_continuity_valid = Boolean(timeline.lineage_reference) && timeline.entries.every((item) => item.lineage_reference);
  const hash_chain_valid = Boolean(timeline.integrity_hash) && timeline.entries.every((item, index) => item.entry_hash === computeEntryHash(item) && item.previous_hash === (index === 0 ? "GENESIS" : timeline.entries[index - 1].entry_hash) && item.verification_status === "VERIFIED") && computeTimelineHash(timeline) === timeline.timeline_hash;
  const immutable_history_preserved = timeline.append_only && timeline.read_only_after_recording && !timeline.historical_entry_modified && !timeline.entry_deleted && !timeline.entry_reordered;
  const governance_valid = !timeline.governance_bypassed;
  const constitutional_valid = !timeline.autonomous_execution_authorized;
  const authority_valid = !timeline.authority_overridden;
  const tenant_isolated = timeline.tenant_id.startsWith("tenant:") && timeline.entries.every((item) => item.tenant_id === timeline.tenant_id && item.source_score.tenant_id === timeline.tenant_id);
  const advisory_only_behavior_enforced = timeline.advisory_only && !timeline.autonomous_execution_authorized && !timeline.governance_bypassed && !timeline.authority_overridden;
  const failures = unique([
    ...(!timeline_contract_valid ? ["TIMELINE_CONTRACT_INVALID" as const] : []),
    ...(!unique_entries ? ["DUPLICATE_ENTRY_DETECTED" as const] : []),
    ...(!score_history_valid ? ["SCORE_INVALID" as const] : []),
    ...(!confidence_history_valid ? ["CONFIDENCE_INVALID" as const] : []),
    ...(!deterministic_ordering ? ["TIMELINE_ORDER_INVALID" as const] : []),
    ...(!timestamp_consistency_valid ? ["TIMESTAMP_INCONSISTENT" as const] : []),
    ...(!evidence_complete ? ["EVIDENCE_MISSING" as const] : []),
    ...(!replay_references_present ? ["REPLAY_REFERENCE_MISSING" as const] : []),
    ...(!lineage_continuity_valid ? ["LINEAGE_BROKEN" as const] : []),
    ...(!hash_chain_valid ? ["HASH_CHAIN_INVALID" as const] : []),
    ...(!immutable_history_preserved ? [timeline.entry_deleted ? "DELETE_ATTEMPT_DETECTED" as const : "IMMUTABLE_HISTORY_VIOLATION" as const] : []),
    ...(!governance_valid ? ["GOVERNANCE_INVALID" as const] : []),
    ...(!constitutional_valid ? ["CONSTITUTIONAL_INVALID" as const] : []),
    ...(!authority_valid ? ["AUTHORITY_INVALID" as const] : []),
    ...(!tenant_isolated ? ["TENANT_ISOLATION_INVALID" as const] : []),
    ...(!advisory_only_behavior_enforced ? ["ADVISORY_ONLY_VIOLATION" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { timeline_id: timeline.timeline_id, valid, timeline_contract_valid, unique_entries, score_history_valid, confidence_history_valid, deterministic_ordering, timestamp_consistency_valid, evidence_complete, replay_references_present, lineage_continuity_valid, hash_chain_valid, immutable_history_preserved, governance_valid, constitutional_valid, authority_valid, tenant_isolated, advisory_only_behavior_enforced, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("mission-health-timeline-validation", source) });
}

export function buildMissionHealthTimelineObservabilitySurface(timeline = buildMissionHealthTimeline()): MissionHealthTimelineObservabilitySurface {
  return Object.freeze({ timeline_id: timeline.timeline_id, mission_id: timeline.mission_id, tenant_id: timeline.tenant_id, timeline_state: timeline.timeline_state, entry_count: timeline.entry_count, degradation_event_count: timeline.degradation_events.length, acknowledgement_count: timeline.operator_acknowledgements.length, latest_entry: timeline.latest_entry, advisory_only: true, timeline_hash: timeline.timeline_hash });
}

export function getMissionHealthTimelineEngineContract(): MissionHealthTimelineEngineContract {
  const timeline = buildMissionHealthTimeline();
  return Object.freeze({
    doctrine: Object.freeze({
      engine_version: VERSION,
      principles: freezeArray(["append-only-ledger", "read-only-history", "deterministic-ordering", "hash-chain-integrity", "subsystem-snapshot-preservation", "operator-visibility", "forensic-reconstruction", "replay-reproducibility", "tenant-isolation", "advisory-only-behavior"]),
      timeline_states: states,
      event_types: eventTypes,
      acknowledgement_types: ackTypes,
      degradation_event_types: degradationTypes,
      confidence_levels: confidenceLevels,
      advisory_only: true,
    }),
    timeline,
    validation: validateMissionHealthTimeline(timeline),
    replay: replayMissionHealthTimeline(timeline),
    observability: buildMissionHealthTimelineObservabilitySurface(timeline),
  });
}
