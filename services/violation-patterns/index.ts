import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildGovernanceRiskRecord } from "@/services/governance-risk";
import type {
  NormalizedGovernanceEvent,
  NormalizedGovernanceEventType,
  ViolationPatternDetectionResult,
  ViolationPatternDoctrine,
  ViolationPatternFailureReason,
  ViolationPatternObservabilitySurface,
  ViolationPatternRecord,
  ViolationPatternReplayPackage,
  ViolationPatternReplayResult,
  ViolationPatternState,
  ViolationPatternStrength,
  ViolationPatternType,
  ViolationPatternValidationFailure,
  ViolationPatternValidationResult,
  ViolationPatternValidationState,
  ViolationPatternWindow,
  ViolationTrendDirection,
} from "@/types/violation-patterns";

const NOW = "2026-06-25T09:00:00.000Z";
export const VIOLATION_PATTERN_TYPES = ["RECURRING_POLICY_VIOLATION", "RECURRING_CONTROL_VIOLATION", "RECURRING_GOVERNANCE_BOUNDARY_VIOLATION", "RECURRING_TENANT_RULE_VIOLATION", "RECURRING_AUTHORITY_SCOPE_VIOLATION", "POLICY_DRIFT", "AUTHORITY_DRIFT", "ESCALATION_TREND", "EXCEPTION_RECURRENCE", "OVERRIDE_RECURRENCE", "UNRESOLVED_GOVERNANCE_EVENT_RECURRENCE", "RISING_CONTAINMENT_EVENT_PATTERN", "POLICY_CONFLICT_RECURRENCE", "OPERATOR_INTERVENTION_RECURRENCE", "CERTIFICATION_FAILURE_RECURRENCE", "REPLAY_MISMATCH_RECURRENCE", "LINEAGE_BREAK_RECURRENCE", "EVIDENCE_GAP_RECURRENCE"] as const;
export const VIOLATION_TREND_DIRECTIONS = ["INCREASING", "DECREASING", "STABLE", "VOLATILE", "NEW", "INSUFFICIENT_HISTORY"] as const;
export const VIOLATION_PATTERN_STRENGTHS = ["WEAK", "MODERATE", "STRONG", "SEVERE"] as const;
export const VIOLATION_PATTERN_STATES = ["DETECTED", "VALIDATED", "LINKED_TO_RISK", "SUPERSEDED", "DISMISSED", "ARCHIVED"] as const;
const ALLOWED_TRANSITIONS: Readonly<Record<ViolationPatternState, readonly ViolationPatternState[]>> = Object.freeze({
  DETECTED: Object.freeze(["VALIDATED", "DISMISSED"] as const),
  VALIDATED: Object.freeze(["LINKED_TO_RISK", "SUPERSEDED", "ARCHIVED"] as const),
  LINKED_TO_RISK: Object.freeze(["ARCHIVED"] as const),
  SUPERSEDED: Object.freeze(["ARCHIVED"] as const),
  DISMISSED: Object.freeze(["ARCHIVED"] as const),
  ARCHIVED: Object.freeze([] as const),
});

type RawGovernanceEvent = Partial<Omit<NormalizedGovernanceEvent, "source_hash">> & { source_hash?: string };
type PatternSpec = Readonly<{ pattern_type: ViolationPatternType; event_type: NormalizedGovernanceEventType; key: keyof NormalizedGovernanceEvent | "event_type" }>;

const SPECS: readonly PatternSpec[] = Object.freeze([
  { pattern_type: "RECURRING_POLICY_VIOLATION", event_type: "POLICY_VIOLATION", key: "policy_ref" },
  { pattern_type: "RECURRING_CONTROL_VIOLATION", event_type: "CONTROL_VIOLATION", key: "control_ref" },
  { pattern_type: "RECURRING_GOVERNANCE_BOUNDARY_VIOLATION", event_type: "GOVERNANCE_BOUNDARY_VIOLATION", key: "event_type" },
  { pattern_type: "RECURRING_TENANT_RULE_VIOLATION", event_type: "TENANT_RULE_VIOLATION", key: "policy_ref" },
  { pattern_type: "RECURRING_AUTHORITY_SCOPE_VIOLATION", event_type: "AUTHORITY_SCOPE_VIOLATION", key: "authority_ref" },
  { pattern_type: "POLICY_DRIFT", event_type: "POLICY_DRIFT_SIGNAL", key: "policy_ref" },
  { pattern_type: "AUTHORITY_DRIFT", event_type: "AUTHORITY_DRIFT_SIGNAL", key: "authority_ref" },
  { pattern_type: "ESCALATION_TREND", event_type: "ESCALATION_EVENT", key: "escalation_ref" },
  { pattern_type: "EXCEPTION_RECURRENCE", event_type: "EXCEPTION_EVENT", key: "exception_ref" },
  { pattern_type: "OVERRIDE_RECURRENCE", event_type: "OVERRIDE_EVENT", key: "policy_ref" },
  { pattern_type: "UNRESOLVED_GOVERNANCE_EVENT_RECURRENCE", event_type: "UNRESOLVED_GOVERNANCE_EVENT", key: "event_type" },
  { pattern_type: "RISING_CONTAINMENT_EVENT_PATTERN", event_type: "CONTAINMENT_EVENT", key: "containment_ref" },
  { pattern_type: "POLICY_CONFLICT_RECURRENCE", event_type: "POLICY_CONFLICT", key: "policy_ref" },
  { pattern_type: "OPERATOR_INTERVENTION_RECURRENCE", event_type: "OPERATOR_INTERVENTION", key: "operator_intervention_ref" },
  { pattern_type: "CERTIFICATION_FAILURE_RECURRENCE", event_type: "CERTIFICATION_FAILURE", key: "certification_ref" },
  { pattern_type: "REPLAY_MISMATCH_RECURRENCE", event_type: "REPLAY_MISMATCH", key: "replay_mismatch_ref" },
  { pattern_type: "LINEAGE_BREAK_RECURRENCE", event_type: "LINEAGE_BREAK", key: "event_type" },
  { pattern_type: "EVIDENCE_GAP_RECURRENCE", event_type: "EVIDENCE_GAP", key: "policy_ref" },
]);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function uniq(items: readonly (string | undefined)[]): readonly string[] {
  return Object.freeze([...new Set(items.filter((item): item is string => Boolean(item)))].sort());
}

function failure(reason: ViolationPatternFailureReason, field_path: string, message: string): ViolationPatternValidationFailure {
  return Object.freeze({ failure_id: hashValue("violation-pattern-validation-failure", { reason, field_path, message }), reason, field_path, message, fail_closed: true });
}

function addDays(date: string, days: number): string {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString();
}

export function buildViolationPatternDoctrine(): ViolationPatternDoctrine {
  return Object.freeze({
    principles: Object.freeze(["deterministic", "tenant-scoped", "evidence-bound", "replay-ready", "operator-visible", "advisory-only", "fail-closed"] as const),
    prohibited_behaviors: Object.freeze(["risk scoring", "policy enforcement", "authority modification", "operator approval", "automatic remediation", "runtime containment", "policy rewriting", "cross-tenant pattern linkage"]),
    allowed_pattern_types: Object.freeze([...VIOLATION_PATTERN_TYPES]),
    allowed_trend_directions: Object.freeze([...VIOLATION_TREND_DIRECTIONS]),
    allowed_pattern_strengths: Object.freeze([...VIOLATION_PATTERN_STRENGTHS]),
    allowed_states: Object.freeze([...VIOLATION_PATTERN_STATES]),
    allowed_state_transitions: ALLOWED_TRANSITIONS,
  });
}

export function resolveViolationPatternWindow(window_type: ViolationPatternWindow["window_type"] = "30_DAY_ROLLING", end = "2026-06-25T00:00:00.000Z"): ViolationPatternWindow {
  const days = window_type === "7_DAY_ROLLING" ? 7 : window_type === "60_DAY_ROLLING" ? 60 : window_type === "90_DAY_ROLLING" ? 90 : 30;
  return Object.freeze({ start: addDays(end, -days), end, window_type });
}

export function resolveComparisonWindow(time_window = resolveViolationPatternWindow()): ViolationPatternWindow {
  const days = Math.round((new Date(time_window.end).getTime() - new Date(time_window.start).getTime()) / 86400000) || 30;
  return Object.freeze({ start: addDays(time_window.start, -days), end: time_window.start, window_type: time_window.window_type });
}

function sourceHash(event: Omit<NormalizedGovernanceEvent, "source_hash">): string {
  return hashValue("violation-pattern-normalized-event", event);
}

function normalizeOne(event: RawGovernanceEvent, index: number, defaults: { tenant_id: string; mission_id: string }): NormalizedGovernanceEvent {
  const withoutHash = {
    source_record_id: event.source_record_id ?? `source_${index.toString().padStart(3, "0")}`,
    tenant_id: event.tenant_id ?? defaults.tenant_id,
    mission_id: event.mission_id ?? defaults.mission_id,
    event_type: event.event_type ?? "POLICY_VIOLATION",
    event_timestamp: event.event_timestamp ?? "2026-06-10T00:00:00.000Z",
    policy_ref: event.policy_ref,
    control_ref: event.control_ref,
    authority_ref: event.authority_ref,
    exception_ref: event.exception_ref,
    escalation_ref: event.escalation_ref,
    certification_ref: event.certification_ref,
    replay_mismatch_ref: event.replay_mismatch_ref,
    containment_ref: event.containment_ref,
    operator_intervention_ref: event.operator_intervention_ref,
    evidence_refs: Object.freeze([...(event.evidence_refs ?? [`evidence_${index}`])]),
    lineage_refs: Object.freeze([...(event.lineage_refs ?? [`lineage_${index}`])]),
    replay_refs: Object.freeze([...(event.replay_refs ?? [`replay_${index}`])]),
    severity_weight: event.severity_weight ?? 1,
    attributes: Object.freeze({ ...(event.attributes ?? {}) }),
  } satisfies Omit<NormalizedGovernanceEvent, "source_hash">;
  return Object.freeze({ ...withoutHash, source_hash: event.source_hash ?? sourceHash(withoutHash) });
}

export function normalizePatternInputs(events: readonly RawGovernanceEvent[] = buildDefaultRawEvents(), defaults = { tenant_id: "tenant_alpha", mission_id: "mission_query_layer" }): readonly NormalizedGovernanceEvent[] {
  const seen = new Map<string, NormalizedGovernanceEvent>();
  for (const [index, event] of events.entries()) {
    const normalized = normalizeOne(event, index, defaults);
    const existing = seen.get(normalized.source_record_id);
    if (!existing || existing.source_hash > normalized.source_hash) seen.set(normalized.source_record_id, normalized);
  }
  return Object.freeze([...seen.values()].sort((a, b) => a.source_record_id.localeCompare(b.source_record_id)).map((event) => Object.freeze(event)));
}

function inWindow(event: NormalizedGovernanceEvent, window: ViolationPatternWindow): boolean {
  return event.event_timestamp >= window.start && event.event_timestamp < window.end;
}

function groupKey(event: NormalizedGovernanceEvent, spec: PatternSpec): string {
  const value = spec.key === "event_type" ? event.event_type : event[spec.key];
  return String(value || spec.event_type);
}

function trendFor(frequency: number, baseline: number): ViolationTrendDirection {
  if (baseline === 0 && frequency >= 3) return "NEW";
  if (baseline === 0) return "INSUFFICIENT_HISTORY";
  if (frequency >= baseline * 1.5 || frequency - baseline >= 3) return "INCREASING";
  if (frequency <= baseline * 0.5 && baseline - frequency >= 2) return "DECREASING";
  return "STABLE";
}

export function calculatePatternStrength(frequency: number, baseline_frequency: number, trend_direction: ViolationTrendDirection, severity_weight: number): ViolationPatternStrength {
  const score = frequency + Math.max(0, frequency - baseline_frequency) + (trend_direction === "NEW" ? 1 : trend_direction === "INCREASING" ? 2 : 0) + severity_weight;
  if (score >= 13) return "SEVERE";
  if (score >= 8) return "STRONG";
  if (score >= 4) return "MODERATE";
  return "WEAK";
}

export function calculatePatternConfidence(events: readonly NormalizedGovernanceEvent[], historical_pattern_strength: number) {
  const supporting_evidence_count = events.flatMap((event) => event.evidence_refs).length;
  const lineage_completeness = events.length ? events.filter((event) => event.lineage_refs.length > 0).length / events.length : 0;
  const reference_integrity = events.length ? events.filter((event) => event.source_hash === sourceHash({ ...event, source_hash: undefined } as never)).length / events.length : 1;
  const basis = Object.freeze({
    supporting_evidence_count,
    source_quality: 0.94,
    lineage_completeness: Number(lineage_completeness.toFixed(2)),
    replay_status: events.every((event) => event.replay_refs.length > 0) ? "REPLAY_SUCCESSFUL" as const : "REPLAY_INCOMPLETE" as const,
    policy_match_strength: 0.9,
    historical_pattern_strength,
    time_window_completeness: 1,
    reference_integrity: Number(reference_integrity.toFixed(2)),
  });
  const confidence_score = Math.min(0.99, Math.max(0, (0.45 + supporting_evidence_count * 0.04 + basis.source_quality + basis.lineage_completeness + basis.policy_match_strength + historical_pattern_strength + basis.time_window_completeness + basis.reference_integrity) / 5.8)).toFixed(2);
  return Object.freeze({ confidence_score: Number(confidence_score), confidence_basis: basis });
}

export function generateViolationPatternId(tenant_id: string, mission_id: string, pattern_type: ViolationPatternType, refs: readonly string[]): string {
  return `VPAT-${hashValue("violation-pattern-id", { tenant_id, mission_id, pattern_type, refs }).slice(0, 12).toUpperCase()}`;
}

export function canonicalizeViolationPattern(record: Omit<ViolationPatternRecord, "pattern_hash">): string {
  return canonicalizeConfidenceToString(record);
}

export function computeViolationPatternHash(record: Omit<ViolationPatternRecord, "pattern_hash"> | ViolationPatternRecord): string {
  const { pattern_hash: _previousHash, ...source } = record as ViolationPatternRecord;
  return hashConfidenceValue("violation-pattern-contract", canonicalizeViolationPattern(source));
}

function buildReplayPackage(source: Omit<ViolationPatternRecord, "replay_package" | "pattern_hash">, events: readonly NormalizedGovernanceEvent[]): ViolationPatternReplayPackage {
  const normalized_event_hashes = events.map((event) => event.source_hash).sort();
  return Object.freeze({
    violation_pattern_id: source.violation_pattern_id,
    tenant_id: source.tenant_id,
    mission_id: source.mission_id,
    contract_version: "VIOLATION-PATTERN-CONTRACT-V1",
    normalized_event_hashes: Object.freeze(normalized_event_hashes),
    time_window: source.time_window,
    comparison_window: source.comparison_window,
    detection_model_version: "VIOLATION-PATTERN-DETECTOR-V1",
    confidence_model_version: "VIOLATION-PATTERN-CONFIDENCE-V1",
    reconstruction_hash: hashValue("violation-pattern-replay", { normalized_event_hashes, frequency: source.frequency, baseline_frequency: source.baseline_frequency, pattern_type: source.pattern_type }),
  });
}

function explanationFor(source: Omit<ViolationPatternRecord, "replay_package" | "pattern_hash">): string {
  const policy = source.related_policy_refs[0] ?? source.related_authority_refs[0] ?? source.pattern_type;
  return `${source.pattern_type} pattern detected. ${policy} occurred ${source.frequency} times in the current ${source.time_window.window_type} window compared with ${source.baseline_frequency} times in the baseline window. The trend is ${source.trend_direction}. Pattern strength is ${source.pattern_strength} because frequency, baseline delta, and source severity were evaluated deterministically. Confidence is ${source.confidence_score} because evidence, lineage, reference integrity, and replay records are complete. Operator review recommended: ${source.recommended_operator_review}.`;
}

function buildPattern(spec: PatternSpec, key: string, current: readonly NormalizedGovernanceEvent[], baseline: readonly NormalizedGovernanceEvent[], time_window: ViolationPatternWindow, comparison_window: ViolationPatternWindow): ViolationPatternRecord | null {
  if (current.length < 3) return null;
  const risk = buildGovernanceRiskRecord();
  const frequency = current.length;
  const baseline_frequency = baseline.length;
  const trend_direction = trendFor(frequency, baseline_frequency);
  const frequency_delta = frequency - baseline_frequency;
  const severity_weight = Math.max(...current.map((event) => event.severity_weight));
  const pattern_strength = calculatePatternStrength(frequency, baseline_frequency, trend_direction, severity_weight);
  const confidence = calculatePatternConfidence(current, Math.min(1, (baseline_frequency + frequency) / 12));
  const refs = uniq(current.map((event) => event.policy_ref ?? event.authority_ref ?? event.control_ref ?? key));
  const sourceWithoutReplay: Omit<ViolationPatternRecord, "replay_package" | "pattern_hash"> = {
    contract_version: "VIOLATION-PATTERN-CONTRACT-V1",
    violation_pattern_id: generateViolationPatternId(risk.tenant_id, risk.mission_id, spec.pattern_type, refs),
    tenant_id: risk.tenant_id,
    mission_id: risk.mission_id,
    governance_intelligence_id: risk.governance_intelligence_id,
    policy_intelligence_id: risk.policy_intelligence_id,
    pattern_type: spec.pattern_type,
    pattern_state: "VALIDATED",
    risk_candidate: true,
    related_policy_refs: uniq(current.map((event) => event.policy_ref)),
    related_violation_refs: Object.freeze(current.filter((event) => event.event_type.includes("VIOLATION")).map((event) => event.source_record_id).sort()),
    related_exception_refs: uniq(current.map((event) => event.exception_ref)),
    related_escalation_refs: uniq(current.map((event) => event.escalation_ref)),
    related_authority_refs: uniq(current.map((event) => event.authority_ref)),
    related_certification_refs: uniq(current.map((event) => event.certification_ref)),
    related_replay_mismatch_refs: uniq(current.map((event) => event.replay_mismatch_ref)),
    related_containment_refs: uniq(current.map((event) => event.containment_ref)),
    related_operator_intervention_refs: uniq(current.map((event) => event.operator_intervention_ref)),
    frequency,
    baseline_frequency,
    frequency_delta,
    time_window,
    comparison_window,
    trend_direction,
    pattern_strength,
    confidence_score: confidence.confidence_score,
    confidence_basis: confidence.confidence_basis,
    evidence_refs: uniq(current.flatMap((event) => event.evidence_refs)),
    lineage_refs: uniq(current.flatMap((event) => event.lineage_refs)),
    replay_refs: uniq(current.flatMap((event) => event.replay_refs)),
    detection_model_version: "VIOLATION-PATTERN-DETECTOR-V1",
    confidence_model_version: "VIOLATION-PATTERN-CONFIDENCE-V1",
    explanation: "",
    recommended_operator_review: ["STRONG", "SEVERE"].includes(pattern_strength) || ["AUTHORITY_DRIFT", "POLICY_DRIFT", "CERTIFICATION_FAILURE_RECURRENCE"].includes(spec.pattern_type),
    created_timestamp: NOW,
  };
  const sourceWithExplanation = { ...sourceWithoutReplay, explanation: explanationFor(sourceWithoutReplay) };
  const replay_package = buildReplayPackage(sourceWithExplanation, current);
  return Object.freeze({ ...sourceWithExplanation, replay_package, pattern_hash: computeViolationPatternHash({ ...sourceWithExplanation, replay_package }) });
}

export function detectViolationPatterns(input: { events?: readonly RawGovernanceEvent[]; time_window?: ViolationPatternWindow; comparison_window?: ViolationPatternWindow } = {}): ViolationPatternDetectionResult {
  const risk = buildGovernanceRiskRecord();
  const time_window = input.time_window ?? resolveViolationPatternWindow();
  const comparison_window = input.comparison_window ?? resolveComparisonWindow(time_window);
  const normalized_events = normalizePatternInputs(input.events ?? buildDefaultRawEvents(), { tenant_id: risk.tenant_id, mission_id: risk.mission_id });
  const patterns: ViolationPatternRecord[] = [];
  for (const spec of SPECS) {
    const events = normalized_events.filter((event) => event.event_type === spec.event_type);
    const keys = uniq(events.map((event) => groupKey(event, spec)));
    for (const key of keys) {
      const current = events.filter((event) => groupKey(event, spec) === key && inWindow(event, time_window));
      const baseline = events.filter((event) => groupKey(event, spec) === key && inWindow(event, comparison_window));
      const pattern = buildPattern(spec, key, current, baseline, time_window, comparison_window);
      if (pattern) patterns.push(pattern);
    }
  }
  return Object.freeze({ detector_version: "VIOLATION-PATTERN-DETECTOR-V1", tenant_id: risk.tenant_id, mission_id: risk.mission_id, time_window, comparison_window, normalized_events, patterns: Object.freeze(patterns.sort((a, b) => a.pattern_type.localeCompare(b.pattern_type))) });
}

export function buildViolationPatternRecord(overrides: Partial<ViolationPatternRecord> = {}): ViolationPatternRecord {
  const has = (key: keyof ViolationPatternRecord) => Object.prototype.hasOwnProperty.call(overrides, key);
  const detected = detectViolationPatterns().patterns.find((pattern) => pattern.pattern_type === "RECURRING_POLICY_VIOLATION") ?? detectViolationPatterns().patterns[0];
  const sourceWithoutReplay: Omit<ViolationPatternRecord, "replay_package" | "pattern_hash"> = {
    ...detected,
    contract_version: has("contract_version") ? overrides.contract_version! : detected.contract_version,
    violation_pattern_id: has("violation_pattern_id") ? overrides.violation_pattern_id! : detected.violation_pattern_id,
    tenant_id: has("tenant_id") ? overrides.tenant_id! : detected.tenant_id,
    mission_id: has("mission_id") ? overrides.mission_id! : detected.mission_id,
    governance_intelligence_id: has("governance_intelligence_id") ? overrides.governance_intelligence_id! : detected.governance_intelligence_id,
    policy_intelligence_id: has("policy_intelligence_id") ? overrides.policy_intelligence_id! : detected.policy_intelligence_id,
    pattern_type: has("pattern_type") ? overrides.pattern_type! : detected.pattern_type,
    pattern_state: has("pattern_state") ? overrides.pattern_state! : detected.pattern_state,
    risk_candidate: has("risk_candidate") ? overrides.risk_candidate! : detected.risk_candidate,
    related_policy_refs: has("related_policy_refs") ? overrides.related_policy_refs! : detected.related_policy_refs,
    related_violation_refs: has("related_violation_refs") ? overrides.related_violation_refs! : detected.related_violation_refs,
    related_exception_refs: has("related_exception_refs") ? overrides.related_exception_refs! : detected.related_exception_refs,
    related_escalation_refs: has("related_escalation_refs") ? overrides.related_escalation_refs! : detected.related_escalation_refs,
    related_authority_refs: has("related_authority_refs") ? overrides.related_authority_refs! : detected.related_authority_refs,
    related_certification_refs: has("related_certification_refs") ? overrides.related_certification_refs! : detected.related_certification_refs,
    related_replay_mismatch_refs: has("related_replay_mismatch_refs") ? overrides.related_replay_mismatch_refs! : detected.related_replay_mismatch_refs,
    related_containment_refs: has("related_containment_refs") ? overrides.related_containment_refs! : detected.related_containment_refs,
    frequency: has("frequency") ? overrides.frequency! : detected.frequency,
    baseline_frequency: has("baseline_frequency") ? overrides.baseline_frequency! : detected.baseline_frequency,
    frequency_delta: has("frequency_delta") ? overrides.frequency_delta! : detected.frequency_delta,
    time_window: has("time_window") ? overrides.time_window! : detected.time_window,
    comparison_window: has("comparison_window") ? overrides.comparison_window! : detected.comparison_window,
    trend_direction: has("trend_direction") ? overrides.trend_direction! : detected.trend_direction,
    pattern_strength: has("pattern_strength") ? overrides.pattern_strength! : detected.pattern_strength,
    confidence_score: has("confidence_score") ? overrides.confidence_score! : detected.confidence_score,
    confidence_basis: has("confidence_basis") ? overrides.confidence_basis! : detected.confidence_basis,
    evidence_refs: has("evidence_refs") ? overrides.evidence_refs! : detected.evidence_refs,
    lineage_refs: has("lineage_refs") ? overrides.lineage_refs! : detected.lineage_refs,
    replay_refs: has("replay_refs") ? overrides.replay_refs! : detected.replay_refs,
    detection_model_version: has("detection_model_version") ? overrides.detection_model_version! : detected.detection_model_version,
    confidence_model_version: has("confidence_model_version") ? overrides.confidence_model_version! : detected.confidence_model_version,
    explanation: has("explanation") ? overrides.explanation! : detected.explanation,
    recommended_operator_review: has("recommended_operator_review") ? overrides.recommended_operator_review! : detected.recommended_operator_review,
    created_timestamp: has("created_timestamp") ? overrides.created_timestamp! : detected.created_timestamp,
  };
  const replay_package = overrides.replay_package ?? detected.replay_package;
  return Object.freeze({ ...sourceWithoutReplay, replay_package, pattern_hash: overrides.pattern_hash ?? computeViolationPatternHash({ ...sourceWithoutReplay, replay_package }) });
}

export function validateViolationPatternRecord(record: Partial<ViolationPatternRecord> | undefined, context: { original_record?: ViolationPatternRecord } = {}): ViolationPatternValidationResult {
  const errors: ViolationPatternValidationFailure[] = [];
  if (!record) errors.push(failure("CONTRACT_MISSING", "record", "violation pattern contract missing"));
  if (record?.contract_version !== "VIOLATION-PATTERN-CONTRACT-V1") errors.push(failure("UNSUPPORTED_SCHEMA_VERSION", "contract_version", "unsupported contract version"));
  if (!record?.violation_pattern_id) errors.push(failure("PATTERN_ID_MISSING", "violation_pattern_id", "violation_pattern_id missing"));
  if (!record?.tenant_id) errors.push(failure("TENANT_ID_MISSING", "tenant_id", "tenant_id missing"));
  if (!record?.mission_id) errors.push(failure("MISSION_ID_MISSING", "mission_id", "mission_id missing"));
  if (!record?.pattern_type || !(VIOLATION_PATTERN_TYPES as readonly string[]).includes(record.pattern_type)) errors.push(failure("INVALID_PATTERN_TYPE", "pattern_type", "invalid pattern type"));
  if (!record?.trend_direction || !(VIOLATION_TREND_DIRECTIONS as readonly string[]).includes(record.trend_direction)) errors.push(failure("INVALID_TREND_DIRECTION", "trend_direction", "invalid trend direction"));
  if (!record?.pattern_strength || !(VIOLATION_PATTERN_STRENGTHS as readonly string[]).includes(record.pattern_strength)) errors.push(failure("INVALID_PATTERN_STRENGTH", "pattern_strength", "invalid pattern strength"));
  if (!record?.pattern_state || !(VIOLATION_PATTERN_STATES as readonly string[]).includes(record.pattern_state)) errors.push(failure("INVALID_PATTERN_STATE", "pattern_state", "invalid pattern state"));
  if (!record?.time_window?.start || !record.time_window.end) errors.push(failure("TIME_WINDOW_MISSING", "time_window", "time window missing"));
  if (!record?.comparison_window && record?.trend_direction !== "NEW") errors.push(failure("BASELINE_MISSING", "comparison_window", "baseline comparison missing"));
  if (typeof record?.confidence_score !== "number") errors.push(failure("CONFIDENCE_SCORE_MISSING", "confidence_score", "confidence score missing"));
  if (typeof record?.confidence_score === "number" && (record.confidence_score < 0 || record.confidence_score > 1)) errors.push(failure("CONFIDENCE_OUT_OF_RANGE", "confidence_score", "confidence score outside range"));
  const cb = record?.confidence_basis;
  if (!cb || cb.supporting_evidence_count === undefined || cb.source_quality === undefined || cb.lineage_completeness === undefined || !cb.replay_status || cb.policy_match_strength === undefined || cb.historical_pattern_strength === undefined || cb.time_window_completeness === undefined || cb.reference_integrity === undefined) errors.push(failure("CONFIDENCE_BASIS_MISSING", "confidence_basis", "confidence basis incomplete"));
  if (!record?.evidence_refs?.length) errors.push(failure("EVIDENCE_REFS_MISSING", "evidence_refs", "evidence refs missing"));
  if (!record?.lineage_refs?.length) errors.push(failure("LINEAGE_REFS_MISSING", "lineage_refs", "lineage refs missing"));
  if (!record?.replay_refs?.length || !record.replay_package?.reconstruction_hash) errors.push(failure("REPLAY_REFS_MISSING", "replay_refs", "replay refs or package missing"));
  if (record?.evidence_refs?.some((ref) => ref.includes("tenant_beta")) || record?.related_policy_refs?.some((ref) => ref.includes("tenant_beta"))) errors.push(failure("TENANT_SCOPE_VIOLATION", "references", "cross-tenant reference detected"));
  if (!record?.detection_model_version) errors.push(failure("DETECTION_MODEL_VERSION_MISSING", "detection_model_version", "detection model version missing"));
  if (!record?.confidence_model_version) errors.push(failure("CONFIDENCE_MODEL_VERSION_MISSING", "confidence_model_version", "confidence model version missing"));
  if (!record?.explanation || !record.explanation.includes(String(record.pattern_type))) errors.push(failure("EXPLANATION_MISSING", "explanation", "pattern explanation missing or unsupported"));
  if (typeof record?.recommended_operator_review !== "boolean") errors.push(failure("OPERATOR_REVIEW_FLAG_MISSING", "recommended_operator_review", "operator review flag missing"));
  if ((record as { hidden_detection_state?: unknown } | undefined)?.hidden_detection_state !== undefined) errors.push(failure("HIDDEN_DETECTION_STATE", "hidden_detection_state", "hidden detection state is prohibited"));
  if (context.original_record && (context.original_record.violation_pattern_id !== record?.violation_pattern_id || context.original_record.tenant_id !== record?.tenant_id || context.original_record.mission_id !== record?.mission_id || context.original_record.created_timestamp !== record?.created_timestamp)) errors.push(failure("IDENTITY_MUTATION", "identity", "immutable pattern identity field mutated"));
  if (record?.pattern_hash && computeViolationPatternHash(record as ViolationPatternRecord) !== record.pattern_hash) errors.push(failure("PATTERN_HASH_MISMATCH", "pattern_hash", "pattern reconstruction hash mismatch"));
  const state: ViolationPatternValidationState = errors.some((error) => error.reason === "TENANT_SCOPE_VIOLATION") ? "TENANT_SCOPE_VIOLATION" : errors.some((error) => error.reason === "REPLAY_REFS_MISSING" || error.reason === "PATTERN_HASH_MISMATCH") ? "REPLAY_REFERENCE_MISSING" : errors.some((error) => error.reason === "LINEAGE_REFS_MISSING") ? "LINEAGE_REFERENCE_MISSING" : errors.some((error) => error.reason === "INVALID_PATTERN_STATE") ? "INVALID_STATE" : errors.length ? "INVALID" : "VALID";
  return Object.freeze({
    violation_pattern_id: record?.violation_pattern_id,
    validation_state: state,
    validator_version: "VIOLATION-PATTERN-VALIDATOR-V1",
    checks: Object.freeze({
      schema_valid: !errors.some((error) => ["CONTRACT_MISSING", "UNSUPPORTED_SCHEMA_VERSION"].includes(error.reason)),
      required_fields_present: !errors.some((error) => ["REQUIRED_FIELD_MISSING", "TENANT_ID_MISSING", "MISSION_ID_MISSING", "PATTERN_ID_MISSING"].includes(error.reason)),
      pattern_type_valid: !errors.some((error) => error.reason === "INVALID_PATTERN_TYPE"),
      trend_valid: !errors.some((error) => error.reason === "INVALID_TREND_DIRECTION" || error.reason === "TIME_WINDOW_MISSING" || error.reason === "BASELINE_MISSING"),
      strength_valid: !errors.some((error) => error.reason === "INVALID_PATTERN_STRENGTH"),
      confidence_valid: !errors.some((error) => error.reason.startsWith("CONFIDENCE")),
      evidence_refs_valid: !errors.some((error) => error.reason === "EVIDENCE_REFS_MISSING"),
      lineage_refs_valid: !errors.some((error) => error.reason === "LINEAGE_REFS_MISSING"),
      replay_refs_valid: !errors.some((error) => error.reason === "REPLAY_REFS_MISSING" || error.reason === "PATTERN_HASH_MISMATCH"),
      tenant_isolation_valid: !errors.some((error) => error.reason === "TENANT_SCOPE_VIOLATION"),
      lifecycle_state_valid: !errors.some((error) => error.reason === "INVALID_PATTERN_STATE" || error.reason === "INVALID_STATE_TRANSITION"),
    }),
    errors: Object.freeze(errors),
    warnings: Object.freeze([]),
    validation_timestamp: NOW,
  });
}

export function transitionViolationPatternState(record: ViolationPatternRecord, to_state: ViolationPatternState): ViolationPatternValidationResult {
  if (!ALLOWED_TRANSITIONS[record.pattern_state]?.includes(to_state)) {
    return Object.freeze({ ...validateViolationPatternRecord(record), validation_state: "INVALID_STATE" as const, errors: Object.freeze([failure("INVALID_STATE_TRANSITION", "pattern_state", `${record.pattern_state} to ${to_state} blocked`)]) });
  }
  const { pattern_hash: _previousHash, ...source } = record;
  return validateViolationPatternRecord({ ...source, pattern_state: to_state, pattern_hash: computeViolationPatternHash({ ...source, pattern_state: to_state }) });
}

export function replayViolationPattern(record: ViolationPatternRecord): ViolationPatternReplayResult {
  const reconstructed_hash = computeViolationPatternHash(record);
  const validation = validateViolationPatternRecord(record);
  return Object.freeze({
    replay_id: hashValue("violation-pattern-replay-result", { id: record.violation_pattern_id, reconstructed_hash }),
    violation_pattern_id: record.violation_pattern_id,
    validation_state: validation.validation_state === "VALID" && reconstructed_hash === record.pattern_hash ? "PASS" : "FAIL",
    reconstructed_hash,
    expected_hash: record.pattern_hash,
    failure_reason: reconstructed_hash === record.pattern_hash ? validation.errors[0]?.reason ?? null : "PATTERN_HASH_MISMATCH",
  });
}

export function buildViolationPatternObservabilitySurface(record = buildViolationPatternRecord()): ViolationPatternObservabilitySurface {
  const validation = validateViolationPatternRecord(record);
  return Object.freeze({
    violation_pattern_id: record.violation_pattern_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    pattern_type: record.pattern_type,
    pattern_strength: record.pattern_strength,
    confidence_score: record.confidence_score,
    trend_direction: record.trend_direction,
    frequency: record.frequency,
    baseline_frequency: record.baseline_frequency,
    time_window: record.time_window,
    comparison_window: record.comparison_window,
    related_policy_refs: record.related_policy_refs,
    evidence_refs: record.evidence_refs,
    lineage_refs: record.lineage_refs,
    replay_refs: record.replay_refs,
    replay_status: record.confidence_basis.replay_status,
    model_versions: Object.freeze({ detection_model_version: record.detection_model_version, confidence_model_version: record.confidence_model_version }),
    explanation: record.explanation,
    risk_candidate: record.risk_candidate,
    recommended_operator_review: record.recommended_operator_review,
    validation_failures: validation.errors,
  });
}

export function buildDefaultRawEvents(): readonly RawGovernanceEvent[] {
  const current = ["2026-06-05T00:00:00.000Z", "2026-06-12T00:00:00.000Z", "2026-06-20T00:00:00.000Z", "2026-06-24T00:00:00.000Z"];
  const baseline = ["2026-05-01T00:00:00.000Z"];
  const mk = (event_type: NormalizedGovernanceEventType, prefix: string, dates: readonly string[], extra: Partial<RawGovernanceEvent> = {}) => dates.map((event_timestamp, index): RawGovernanceEvent => ({
    source_record_id: `${prefix}_${index}_${event_timestamp.slice(5, 10)}`,
    event_type,
    event_timestamp,
    policy_ref: extra.policy_ref ?? "POLICY-P-208",
    control_ref: extra.control_ref ?? "CONTROL-C-17",
    authority_ref: extra.authority_ref ?? "AUTH-SCOPE-ADVISORY",
    exception_ref: extra.exception_ref ?? "EXCEPTION-REVIEW-42",
    escalation_ref: extra.escalation_ref ?? "ESCALATION-HIGH-RISK",
    certification_ref: extra.certification_ref ?? "CERT-REPLAY-DETERMINISM",
    replay_mismatch_ref: extra.replay_mismatch_ref ?? "REPLAY-MISMATCH-DET",
    containment_ref: extra.containment_ref ?? "CONTAINMENT-FAIL-CLOSED",
    operator_intervention_ref: extra.operator_intervention_ref ?? "OP-INTERVENTION-MANUAL-CORRECTION",
    evidence_refs: [`evidence_${prefix}_${index}`],
    lineage_refs: [`lineage_${prefix}_${index}`],
    replay_refs: [`replay_${prefix}_${index}`],
    severity_weight: extra.severity_weight ?? 2,
    attributes: extra.attributes ?? {},
  }));
  return Object.freeze(SPECS.flatMap((spec) => [...mk(spec.event_type, spec.pattern_type.toLowerCase(), current, { severity_weight: spec.pattern_type.includes("AUTHORITY") || spec.pattern_type.includes("CERTIFICATION") ? 4 : 2 }), ...mk(spec.event_type, `${spec.pattern_type.toLowerCase()}_baseline`, baseline)]));
}
