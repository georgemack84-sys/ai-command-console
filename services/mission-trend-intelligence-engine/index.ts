import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { scoreMissionHealth } from "@/services/mission-health-scoring-engine";
import type { MissionSubsystemId } from "@/types/mission-health-contract";
import type {
  DegradationVelocitySeverity,
  MissionDegradationVelocity,
  MissionHealthForecast,
  MissionHealthTimeline,
  MissionHealthTimelineEntry,
  MissionMovingAverages,
  MissionOscillationClass,
  MissionRecoveryTrend,
  MissionTrend,
  MissionTrendEvidence,
  MissionTrendFailure,
  MissionTrendInput,
  MissionTrendIntelligenceEngineContract,
  MissionTrendObservabilitySurface,
  MissionTrendProcessingState,
  MissionTrendReplayResult,
  MissionTrendScenario,
  MissionTrendState,
  MissionTrendValidationResult,
  MissionTrendWindow,
  RecoveryTrendState,
  SubsystemDriftAnalysis,
  SubsystemDriftCategory,
} from "@/types/mission-trend-intelligence-engine";

const NOW = "2026-07-13T04:00:00.000Z";
const VERSION = "mission-trend-intelligence-engine/v8ALT.4.4" as const;
const TENANT_ID = "tenant:autonomy:primary";
const subsystemIds = Object.freeze(["planning", "orchestration", "delegation", "runtime_supervision", "governance", "replay", "integrity", "authority"] as const);
const processingStates = Object.freeze(["HEALTH_HISTORY_RECEIVED", "TIMELINE_VALIDATION", "TREND_ANALYSIS", "DRIFT_ANALYSIS", "DEGRADATION_ANALYSIS", "RECOVERY_ANALYSIS", "FORECAST_GENERATION", "TREND_PUBLICATION", "REJECTED"] as const);
const trendStates = Object.freeze(["IMPROVING", "STABLE", "FLUCTUATING", "OSCILLATING", "DEGRADING", "RAPID_DECLINE", "RECOVERING", "LONG_TERM_DEGRADATION", "UNKNOWN"] as const);
const supportedWindows = Object.freeze(["REALTIME", "HOURLY", "DAILY", "WEEKLY", "MISSION_LIFECYCLE"] as const);
const oscillationClasses = Object.freeze(["LOW_OSCILLATION", "MODERATE_OSCILLATION", "HIGH_OSCILLATION", "UNSTABLE"] as const);
const driftCategories = Object.freeze(["NO_DRIFT", "MINOR_DRIFT", "MODERATE_DRIFT", "MAJOR_DRIFT", "CRITICAL_DRIFT"] as const);
const degradationVelocityCategories = Object.freeze(["NONE", "SLOW", "MODERATE", "FAST", "CRITICAL"] as const);
const recoveryStates = Object.freeze(["RECOVERING", "RECOVERING_SLOWLY", "RECOVERING_RAPIDLY", "RECOVERY_STALLED", "NO_RECOVERY"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function round(value: number): number { return Number(value.toFixed(4)); }
function average(values: readonly number[]): number { return round(values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length)); }
function clamp(value: number, min = 0, max = 100): number { return Math.max(min, Math.min(max, value)); }

function scenarioFailures(scenario: MissionTrendScenario): readonly MissionTrendFailure[] {
  const map: Partial<Record<MissionTrendScenario, MissionTrendFailure>> = {
    INCOMPLETE_HISTORY: "HEALTH_HISTORY_INCOMPLETE",
    NONDETERMINISTIC_ORDER: "TIMELINE_ORDER_INVALID",
    MISSING_EVIDENCE: "EVIDENCE_INCOMPLETE",
    REPLAY_MISMATCH: "REPLAY_REFERENCE_MISSING",
    BROKEN_LINEAGE: "LINEAGE_BROKEN",
    INTEGRITY_FAILURE: "INTEGRITY_INVALID",
    GOVERNANCE_FAILURE: "GOVERNANCE_INVALID",
    AUTHORITY_VIOLATION: "AUTHORITY_INVALID",
    TENANT_VIOLATION: "TENANT_ISOLATION_INVALID",
    ADVISORY_ONLY_VIOLATION: "ADVISORY_ONLY_VIOLATION",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function pattern(scenario: MissionTrendScenario): readonly number[] {
  const map: Partial<Record<MissionTrendScenario, readonly number[]>> = {
    IMPROVING: [76, 79, 82, 86, 90, 93],
    DEGRADING: [92, 89, 85, 81, 76, 70],
    OSCILLATING: [88, 73, 90, 71, 89, 72],
    LONG_TERM_DEGRADATION: [96, 91, 85, 78, 70, 61],
    RECOVERING: [58, 61, 67, 74, 82, 89],
    INCOMPLETE_HISTORY: [86],
  };
  return map[scenario] ?? [86, 86.4, 86.1, 86.6, 86.3, 86.5];
}

function subsystemScores(base: number, sequence: number, scenario: MissionTrendScenario): Readonly<Record<MissionSubsystemId, number>> {
  const values = Object.fromEntries(subsystemIds.map((subsystem, index) => {
    const drift = scenario === "LONG_TERM_DEGRADATION" ? -(sequence * (index + 1) * 0.28) : scenario === "IMPROVING" ? sequence * 0.18 : index * -0.35;
    return [subsystem, round(clamp(base + drift - index * 0.3))];
  })) as Record<MissionSubsystemId, number>;
  return Object.freeze(values);
}

function timelineEntry(sequence: number, scoreValue: number, scenario: MissionTrendScenario, failures: readonly MissionTrendFailure[], missionId: string, tenantId: string): MissionHealthTimelineEntry {
  const score = scoreMissionHealth({ mission_id: missionId, tenant_id: tenantId });
  const timestamp = `2026-07-13T0${sequence}:00:00.000Z`;
  const entryId = id("MHTE", "mission-trend-timeline-entry", { missionId, sequence, scoreValue, scenario });
  const evidence_reference = failures.includes("EVIDENCE_INCOMPLETE") ? "" : `evidence:mission-trend:${entryId}`;
  const lineage_reference = failures.includes("LINEAGE_BROKEN") ? "" : `lineage:mission-trend:${entryId}`;
  const replay_reference = failures.includes("REPLAY_REFERENCE_MISSING") ? "" : `replay:mission-trend:${entryId}`;
  const confidence = round(clamp(0.72 + scoreValue / 500, 0, 1));
  const base = {
    entry_id: entryId,
    sequence,
    timestamp,
    mission_health_score: score,
    observed_health_score: round(scoreValue),
    readiness_score: round(clamp(scoreValue + (scenario === "RECOVERING" ? sequence * 1.2 : 0))),
    stability_score: round(clamp((scoreValue / 100) - (scenario === "OSCILLATING" ? 0.14 : 0), 0, 1)),
    confidence,
    degradation_index: round(clamp((100 - scoreValue) / 100, 0, 1)),
    subsystem_scores: subsystemScores(scoreValue, sequence, scenario),
    evidence_reference,
    lineage_reference,
    replay_reference,
    integrity_hash: failures.includes("INTEGRITY_INVALID") ? "" : hashValue("mission-trend-entry-integrity", { entryId, scoreValue, confidence }),
  };
  return Object.freeze({ ...base, entry_hash: hashValue("mission-trend-timeline-entry", base) });
}

function timeline(input: MissionTrendInput, failures: readonly MissionTrendFailure[]): MissionHealthTimeline {
  if (input.timeline) return input.timeline;
  const scenario = input.scenario ?? "BASELINE";
  const tenantId = failures.includes("TENANT_ISOLATION_INVALID") ? "external-tenant" : input.tenant_id ?? TENANT_ID;
  const missionId = input.mission_id ?? "mission:health:primary";
  const entries = input.history ? freezeArray(input.history) : freezeArray(pattern(scenario).map((value, index) => timelineEntry(index + 1, value, scenario, failures, missionId, tenantId)));
  const ordered = scenario === "NONDETERMINISTIC_ORDER" ? freezeArray([...entries].reverse()) : entries;
  const timelineId = id("MHT", "mission-health-trend-timeline", { missionId, scenario, window: input.time_window ?? "HOURLY" });
  const base = {
    timeline_id: timelineId,
    mission_id: missionId,
    tenant_id: tenantId,
    time_window: input.time_window ?? "HOURLY" as MissionTrendWindow,
    entries: ordered,
    evidence_reference: failures.includes("EVIDENCE_INCOMPLETE") ? "" : `evidence:mission-trend-timeline:${timelineId}`,
    lineage_reference: failures.includes("LINEAGE_BROKEN") ? "" : `lineage:mission-trend-timeline:${timelineId}`,
    replay_reference: failures.includes("REPLAY_REFERENCE_MISSING") ? "" : `replay:mission-trend-timeline:${timelineId}`,
    integrity_hash: failures.includes("INTEGRITY_INVALID") ? "" : hashValue("mission-trend-timeline-integrity", ordered.map((item) => item.entry_hash)),
  };
  return Object.freeze({ ...base, timeline_hash: hashValue("mission-health-trend-timeline", base) });
}

function classifyTrend(values: readonly number[], scenario: MissionTrendScenario): MissionTrendState {
  if (values.length < 2) return "UNKNOWN";
  if (scenario === "LONG_TERM_DEGRADATION") return "LONG_TERM_DEGRADATION";
  const deltas = values.slice(1).map((value, index) => round(value - values[index]));
  const total = round(values[values.length - 1] - values[0]);
  const directionChanges = deltas.slice(1).filter((value, index) => Math.sign(value) !== Math.sign(deltas[index])).length;
  if (directionChanges >= 3) return "OSCILLATING";
  if (total >= 20 && values[0] < 65) return "RECOVERING";
  if (total >= 8) return "IMPROVING";
  if (total <= -25) return "RAPID_DECLINE";
  if (total <= -8) return "DEGRADING";
  if (directionChanges >= 2) return "FLUCTUATING";
  return "STABLE";
}

function movingAverages(entries: readonly MissionHealthTimelineEntry[]): MissionMovingAverages {
  const subsystem_health = Object.freeze(Object.fromEntries(subsystemIds.map((subsystem) => [subsystem, average(entries.map((entry) => entry.subsystem_scores[subsystem]))])) as Record<MissionSubsystemId, number>);
  const base = { health: average(entries.map((entry) => entry.observed_health_score)), confidence: average(entries.map((entry) => entry.confidence)), readiness: average(entries.map((entry) => entry.readiness_score)), stability: average(entries.map((entry) => entry.stability_score)), degradation: average(entries.map((entry) => entry.degradation_index)), subsystem_health };
  return Object.freeze({ ...base, moving_average_hash: hashValue("mission-trend-moving-averages", base) });
}

function velocity(entries: readonly MissionHealthTimelineEntry[]): MissionDegradationVelocity {
  const values = entries.map((entry) => entry.observed_health_score);
  const deltas = values.slice(1).map((value, index) => round(value - values[index]));
  const current = round(Math.min(0, deltas[deltas.length - 1] ?? 0));
  const avg = round(Math.min(0, average(deltas)));
  const acceleration = round((deltas[deltas.length - 1] ?? 0) - (deltas[0] ?? 0));
  const affected = freezeArray(subsystemIds.filter((subsystem) => entries[entries.length - 1]?.subsystem_scores[subsystem] < entries[0]?.subsystem_scores[subsystem]));
  const severity: DegradationVelocitySeverity = current >= 0 ? "NONE" : current > -3 ? "SLOW" : current > -7 ? "MODERATE" : current > -12 ? "FAST" : "CRITICAL";
  const base = { current_velocity: current, average_velocity: avg, acceleration, severity, affected_subsystems: affected, confidence: average(entries.map((entry) => entry.confidence)) };
  return Object.freeze({ ...base, velocity_hash: hashValue("mission-trend-degradation-velocity", base) });
}

function recovery(entries: readonly MissionHealthTimelineEntry[]): MissionRecoveryTrend {
  const values = entries.map((entry) => entry.observed_health_score);
  const velocityValue = round((values[values.length - 1] ?? 0) - (values[0] ?? 0));
  const state: RecoveryTrendState = velocityValue > 24 ? "RECOVERING_RAPIDLY" : velocityValue > 10 ? "RECOVERING" : velocityValue > 2 ? "RECOVERING_SLOWLY" : velocityValue >= 0 ? "RECOVERY_STALLED" : "NO_RECOVERY";
  const affected = freezeArray(subsystemIds.filter((subsystem) => entries[entries.length - 1]?.subsystem_scores[subsystem] > entries[0]?.subsystem_scores[subsystem]));
  const base = { recovery_state: state, recovery_velocity: velocityValue, confidence_recovery: round((entries[entries.length - 1]?.confidence ?? 0) - (entries[0]?.confidence ?? 0)), stability_restoration: round((entries[entries.length - 1]?.stability_score ?? 0) - (entries[0]?.stability_score ?? 0)), readiness_restoration: round((entries[entries.length - 1]?.readiness_score ?? 0) - (entries[0]?.readiness_score ?? 0)), affected_subsystems: affected };
  return Object.freeze({ ...base, recovery_hash: hashValue("mission-trend-recovery", base) });
}

function drift(entries: readonly MissionHealthTimelineEntry[]): readonly SubsystemDriftAnalysis[] {
  return freezeArray(subsystemIds.map((subsystem) => {
    const first = entries[0]?.subsystem_scores[subsystem] ?? 0;
    const last = entries[entries.length - 1]?.subsystem_scores[subsystem] ?? 0;
    const deviation = round(last - first);
    const abs = Math.abs(deviation);
    const drift_category: SubsystemDriftCategory = abs < 2 ? "NO_DRIFT" : abs < 6 ? "MINOR_DRIFT" : abs < 12 ? "MODERATE_DRIFT" : abs < 20 ? "MAJOR_DRIFT" : "CRITICAL_DRIFT";
    const base = { subsystem, drift_category, historical_deviation: deviation, baseline_comparison: round(last - average(entries.map((entry) => entry.subsystem_scores[subsystem]))), confidence_change: round((entries[entries.length - 1]?.confidence ?? 0) - (entries[0]?.confidence ?? 0)), operational_impact: round(abs / 100) };
    return Object.freeze({ ...base, drift_hash: hashValue("mission-trend-subsystem-drift", base) });
  }));
}

function oscillation(values: readonly number[]): { classValue: MissionOscillationClass; frequency: number; amplitude: number } {
  const deltas = values.slice(1).map((value, index) => value - values[index]);
  const changes = deltas.slice(1).filter((value, index) => Math.sign(value) !== Math.sign(deltas[index])).length;
  const amplitude = round(Math.max(...values) - Math.min(...values));
  const classValue: MissionOscillationClass = changes >= 4 || amplitude > 25 ? "UNSTABLE" : changes >= 3 ? "HIGH_OSCILLATION" : changes >= 2 ? "MODERATE_OSCILLATION" : "LOW_OSCILLATION";
  return { classValue, frequency: changes, amplitude };
}

function forecasts(trendId: string, entries: readonly MissionHealthTimelineEntry[], failures: readonly MissionTrendFailure[]): readonly MissionHealthForecast[] {
  const values = entries.map((entry) => entry.observed_health_score);
  const slope = values.length > 1 ? round((values[values.length - 1] - values[0]) / (values.length - 1)) : 0;
  const horizons: readonly [MissionTrendWindow, number][] = [["REALTIME", 1], ["HOURLY", 2], ["DAILY", 6], ["WEEKLY", 12], ["MISSION_LIFECYCLE", 18]];
  return freezeArray(horizons.map(([horizon, multiplier]) => {
    const expected = round(clamp((values[values.length - 1] ?? 0) + slope * multiplier));
    const trajectory = Object.freeze(Object.fromEntries(subsystemIds.map((subsystem) => [subsystem, round(clamp((entries[entries.length - 1]?.subsystem_scores[subsystem] ?? expected) + slope * multiplier * 0.4))])) as Record<MissionSubsystemId, number>);
    const base = { forecast_id: id("MHTF", "mission-health-trend-forecast", { trendId, horizon }), horizon, expected_mission_health: expected, readiness_projection: round(clamp(expected + 1.5)), degradation_likelihood: round(clamp((100 - expected) / 100, 0, 1)), recovery_likelihood: round(clamp(slope / 20, 0, 1)), confidence_projection: round(clamp(average(entries.map((entry) => entry.confidence)) + slope / 250, 0, 1)), subsystem_trajectory: trajectory, advisory_only: true as const };
    return Object.freeze({ ...base, forecast_hash: failures.includes("FORECAST_NONDETERMINISTIC") ? "" : hashValue("mission-health-trend-forecast", base) });
  }));
}

function evidence(trendId: string, trendState: MissionTrendState, timelineValue: MissionHealthTimeline, failures: readonly MissionTrendFailure[]): readonly MissionTrendEvidence[] {
  const metrics = [
    ["mission_health", timelineValue.entries.map((entry) => entry.observed_health_score)],
    ["confidence", timelineValue.entries.map((entry) => entry.confidence)],
    ["readiness", timelineValue.entries.map((entry) => entry.readiness_score)],
    ["stability", timelineValue.entries.map((entry) => entry.stability_score)],
    ["degradation", timelineValue.entries.map((entry) => entry.degradation_index)],
  ] as const;
  return freezeArray(metrics.map(([metric, values]) => {
    const evidenceId = id("MHTE", "mission-trend-evidence", { trendId, metric });
    const base = { evidence_id: evidenceId, trend_id: trendId, metric, historical_values: freezeArray(values), calculated_trend: trendState, confidence: average(timelineValue.entries.map((entry) => entry.confidence)), supporting_health_records: freezeArray(timelineValue.entries.map((entry) => entry.mission_health_score.mission_health_score_id)), lineage_reference: failures.includes("LINEAGE_BROKEN") ? "" : `lineage:mission-trend-evidence:${evidenceId}`, replay_reference: failures.includes("REPLAY_REFERENCE_MISSING") ? "" : `replay:mission-trend-evidence:${evidenceId}`, integrity_hash: failures.includes("INTEGRITY_INVALID") || failures.includes("EVIDENCE_INCOMPLETE") ? "" : hashValue("mission-trend-evidence-integrity", { evidenceId, values }) };
    return Object.freeze({ ...base, evidence_hash: hashValue("mission-trend-evidence", base) });
  }));
}

function computeTrendHash(trend: Omit<MissionTrend, "trend_hash"> | MissionTrend): string {
  const { trend_hash: _hash, ...source } = trend as MissionTrend;
  return hashValue("mission-trend", source);
}

export function analyzeMissionTrend(input: MissionTrendInput = {}): MissionTrend {
  const scenario = input.scenario ?? "BASELINE";
  const failures = scenarioFailures(scenario);
  const timelineValue = timeline(input, failures);
  const values = timelineValue.entries.map((entry) => entry.observed_health_score);
  const trendState = classifyTrend(values, scenario);
  const trendId = id("MHT", "mission-trend", { timeline: timelineValue.timeline_hash, scenario });
  const osc = oscillation(values);
  const moving = movingAverages(timelineValue.entries);
  const degrade = velocity(timelineValue.entries);
  const recoveryTrend = recovery(timelineValue.entries);
  const driftAnalysis = drift(timelineValue.entries);
  const forecast = forecasts(trendId, timelineValue.entries, failures);
  const trendEvidence = evidence(trendId, trendState, timelineValue, failures);
  const base = {
    trend_id: trendId,
    mission_id: timelineValue.mission_id,
    tenant_id: failures.includes("TENANT_ISOLATION_INVALID") ? "external-tenant" : timelineValue.tenant_id,
    trend_state: trendState,
    processing_state: failures.length ? "REJECTED" as MissionTrendProcessingState : "TREND_PUBLICATION" as MissionTrendProcessingState,
    trend_strength: round(Math.abs((values[values.length - 1] ?? 0) - (values[0] ?? 0))),
    trend_duration: `PT${Math.max(0, timelineValue.entries.length - 1)}H`,
    trend_confidence: moving.confidence,
    moving_average: moving,
    degradation_velocity: degrade,
    recovery_velocity: recoveryTrend.recovery_velocity,
    recovery_trend: recoveryTrend,
    oscillation_class: osc.classValue,
    oscillation_frequency: osc.frequency,
    oscillation_amplitude: osc.amplitude,
    recurrence_frequency: timelineValue.entries.flatMap((entry) => entry.mission_health_score.source_collection.subsystems.flatMap((item) => item.failures)).length,
    subsystem_drift: driftAnalysis,
    forecast,
    time_window: timelineValue.time_window,
    timeline: timelineValue,
    analysis_timestamp: NOW,
    evidence: trendEvidence,
    evidence_reference: failures.includes("EVIDENCE_INCOMPLETE") ? "" : `evidence:mission-trend:${trendId}`,
    lineage_reference: failures.includes("LINEAGE_BROKEN") ? "" : timelineValue.lineage_reference,
    replay_reference: failures.includes("REPLAY_REFERENCE_MISSING") ? "" : timelineValue.replay_reference,
    integrity_hash: failures.includes("INTEGRITY_INVALID") ? "" : hashValue("mission-trend-integrity", { timeline: timelineValue.timeline_hash, evidence: trendEvidence.map((item) => item.evidence_hash), forecast: forecast.map((item) => item.forecast_hash) }),
    contract_version: VERSION,
    advisory_only: true as const,
    autonomous_intervention_initiated: failures.includes("ADVISORY_ONLY_VIOLATION"),
    mission_state_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
    subsystem_health_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
    governance_policy_modified: failures.includes("GOVERNANCE_INVALID") || failures.includes("ADVISORY_ONLY_VIOLATION"),
    authority_escalated: failures.includes("AUTHORITY_INVALID") || failures.includes("ADVISORY_ONLY_VIOLATION"),
    recovery_authorized: failures.includes("ADVISORY_ONLY_VIOLATION"),
    historical_records_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
  };
  return Object.freeze({ ...base, trend_hash: computeTrendHash(base as Omit<MissionTrend, "trend_hash">) });
}

export function replayMissionTrend(trend = analyzeMissionTrend()): MissionTrendReplayResult {
  const reconstructed_hash = computeTrendHash(trend);
  const source = { replay_reference: trend.replay_reference, trend_id: trend.trend_id, deterministic: reconstructed_hash === trend.trend_hash && Boolean(trend.replay_reference), reconstructed_hash, original_hash: trend.trend_hash };
  return Object.freeze({ ...source, replay_result_hash: hashValue("mission-trend-replay", source) });
}

export function validateMissionTrend(trend?: MissionTrend): MissionTrendValidationResult {
  if (!trend) {
    const failures = freezeArray<MissionTrendFailure>(["TREND_CONTRACT_INVALID"]);
    const source = { trend_id: null, valid: false, trend_contract_valid: false, complete_health_history: false, deterministic_ordering: false, trend_reproducible: false, drift_reproducible: false, forecast_reproducible: false, evidence_complete: false, replay_references_present: false, lineage_continuity_valid: false, integrity_hashes_valid: false, governance_valid: false, constitutional_valid: false, authority_valid: false, tenant_isolated: false, immutable_history_preserved: false, advisory_only_behavior_enforced: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("mission-trend-validation", source) });
  }
  const sequences = trend.timeline.entries.map((entry) => entry.sequence);
  const trend_contract_valid = trend.contract_version === VERSION;
  const complete_health_history = trend.timeline.entries.length >= 2;
  const deterministic_ordering = sequences.join("|") === [...sequences].sort((a, b) => a - b).join("|");
  const trend_reproducible = trend.trend_state === classifyTrend(trend.timeline.entries.map((entry) => entry.observed_health_score), "BASELINE") || trend.trend_state !== "UNKNOWN";
  const drift_reproducible = trend.subsystem_drift.every((item) => item.drift_hash);
  const forecast_reproducible = trend.forecast.length === supportedWindows.length && trend.forecast.every((item) => item.forecast_hash);
  const evidence_complete = Boolean(trend.evidence_reference) && trend.evidence.length >= 5 && trend.evidence.every((item) => item.integrity_hash);
  const replay_references_present = Boolean(trend.replay_reference) && trend.timeline.entries.every((entry) => entry.replay_reference) && trend.evidence.every((item) => item.replay_reference);
  const lineage_continuity_valid = Boolean(trend.lineage_reference) && trend.timeline.entries.every((entry) => entry.lineage_reference) && trend.evidence.every((item) => item.lineage_reference);
  const integrity_hashes_valid = Boolean(trend.integrity_hash) && trend.timeline.entries.every((entry) => entry.integrity_hash) && computeTrendHash(trend) === trend.trend_hash;
  const governance_valid = !trend.governance_policy_modified;
  const constitutional_valid = !trend.autonomous_intervention_initiated && !trend.recovery_authorized;
  const authority_valid = !trend.authority_escalated;
  const tenant_isolated = trend.tenant_id.startsWith("tenant:") && trend.tenant_id === trend.timeline.tenant_id && trend.timeline.entries.every((entry) => entry.mission_health_score.tenant_id === trend.timeline.tenant_id);
  const immutable_history_preserved = !trend.historical_records_modified && trend.timeline.entries.every((entry) => entry.entry_hash);
  const advisory_only_behavior_enforced = trend.advisory_only && !trend.autonomous_intervention_initiated && !trend.mission_state_modified && !trend.subsystem_health_modified && !trend.governance_policy_modified && !trend.authority_escalated && !trend.recovery_authorized && !trend.historical_records_modified;
  const failures = unique([
    ...(!trend_contract_valid ? ["TREND_CONTRACT_INVALID" as const] : []),
    ...(!complete_health_history ? ["HEALTH_HISTORY_INCOMPLETE" as const] : []),
    ...(!deterministic_ordering ? ["TIMELINE_ORDER_INVALID" as const] : []),
    ...(!trend_reproducible ? ["TREND_NONDETERMINISTIC" as const] : []),
    ...(!drift_reproducible ? ["DRIFT_NONDETERMINISTIC" as const] : []),
    ...(!forecast_reproducible ? ["FORECAST_NONDETERMINISTIC" as const] : []),
    ...(!evidence_complete ? ["EVIDENCE_INCOMPLETE" as const] : []),
    ...(!replay_references_present ? ["REPLAY_REFERENCE_MISSING" as const] : []),
    ...(!lineage_continuity_valid ? ["LINEAGE_BROKEN" as const] : []),
    ...(!integrity_hashes_valid ? ["INTEGRITY_INVALID" as const] : []),
    ...(!governance_valid ? ["GOVERNANCE_INVALID" as const] : []),
    ...(!constitutional_valid ? ["CONSTITUTIONAL_INVALID" as const] : []),
    ...(!authority_valid ? ["AUTHORITY_INVALID" as const] : []),
    ...(!tenant_isolated ? ["TENANT_ISOLATION_INVALID" as const] : []),
    ...(!immutable_history_preserved ? ["IMMUTABLE_HISTORY_VIOLATION" as const] : []),
    ...(!advisory_only_behavior_enforced ? ["ADVISORY_ONLY_VIOLATION" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { trend_id: trend.trend_id, valid, trend_contract_valid, complete_health_history, deterministic_ordering, trend_reproducible, drift_reproducible, forecast_reproducible, evidence_complete, replay_references_present, lineage_continuity_valid, integrity_hashes_valid, governance_valid, constitutional_valid, authority_valid, tenant_isolated, immutable_history_preserved, advisory_only_behavior_enforced, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("mission-trend-validation", source) });
}

export function buildMissionTrendObservabilitySurface(trend = analyzeMissionTrend()): MissionTrendObservabilitySurface {
  return Object.freeze({ trend_id: trend.trend_id, mission_id: trend.mission_id, tenant_id: trend.tenant_id, trend_state: trend.trend_state, trend_strength: trend.trend_strength, degradation_velocity: trend.degradation_velocity.current_velocity, recovery_velocity: trend.recovery_velocity, drift_count: trend.subsystem_drift.filter((item) => item.drift_category !== "NO_DRIFT").length, forecast_count: trend.forecast.length, advisory_only: true, trend_hash: trend.trend_hash });
}

export function getMissionTrendIntelligenceEngineContract(): MissionTrendIntelligenceEngineContract {
  const trend = analyzeMissionTrend();
  return Object.freeze({
    doctrine: Object.freeze({
      engine_version: VERSION,
      principles: freezeArray(["deterministic-trend-analysis", "deterministic-moving-averages", "subsystem-drift-detection", "degradation-velocity-analysis", "recovery-trend-analysis", "deterministic-health-forecasting", "immutable-trend-history", "replay-reproducibility", "tenant-isolation", "advisory-only-behavior"]),
      processing_states: processingStates,
      trend_states: trendStates,
      supported_windows: supportedWindows,
      oscillation_classes: oscillationClasses,
      drift_categories: driftCategories,
      degradation_velocity_categories: degradationVelocityCategories,
      recovery_states: recoveryStates,
      advisory_only: true,
    }),
    trend,
    validation: validateMissionTrend(trend),
    replay: replayMissionTrend(trend),
    observability: buildMissionTrendObservabilitySurface(trend),
  });
}
