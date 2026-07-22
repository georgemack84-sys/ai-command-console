import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { appendPatternIntelligenceLedger, replayPatternIntelligenceLedger } from "@/services/pattern-intelligence-ledger";
import type { PatternLedgerInput, PatternLedgerResult, PatternLedgerRecord } from "@/types/pattern-intelligence-ledger";
import type {
  PatternEvidenceNavigationMap,
  PatternExplainabilityArtifact,
  PatternExplainabilityRegistry,
  PatternReplayApiSurface,
  PatternReplayComparison,
  PatternReplayFailure,
  PatternReplayFoundation,
  PatternReplayInput,
  PatternReplayRecord,
  PatternReplayResult,
  PatternReplayValidation,
  PatternTimelineEvent,
} from "@/types/pattern-replay-explainability";

const PATTERN_REPLAY_VERSION = "pattern-replay-explainability/v1" as const;
const REPLAY_TIMESTAMP = "2026-07-09T00:00:00.000Z";

type Scenario = NonNullable<PatternReplayInput["scenario"]>;

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

function ledgerScenario(scenario: Scenario): PatternLedgerInput["scenario"] {
  const map: Partial<Record<Scenario, PatternLedgerInput["scenario"]>> = {
    MISSING_LEDGER_INPUT: "MISSING_GOVERNANCE_INPUT",
    UNCERTIFIED_LEDGER_INPUT: "UNCERTIFIED_GOVERNANCE_INPUT",
    MISSING_REPLAY: "MISSING_REPLAY",
    MISSING_EVIDENCE: "MISSING_EVIDENCE",
    SCORING_MISMATCH: "MISSING_SCORING",
    GOVERNANCE_MISMATCH: "MISSING_GOVERNANCE_REFS",
    HASH_MISMATCH: "HASH_MISMATCH",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE",
    CROSS_TENANT: "CROSS_TENANT",
    MISSING_EXPLANATION: "MISSING_EXPLANATION",
    HISTORICAL_MUTATION: "RECORD_MUTATION",
  };
  return map[scenario] ?? "BASELINE";
}

function sourceForScenario(input: PatternReplayInput, scenario: Scenario): PatternLedgerResult {
  if (input.ledger_result) return input.ledger_result;
  return appendPatternIntelligenceLedger({ scenario: ledgerScenario(scenario) });
}

function buildApiSurface(): PatternReplayApiSurface {
  const base: Omit<PatternReplayApiSurface, "integrity_hash"> = {
    api_id: "pattern_replay_explainability_api",
    replay_pattern: "POST /pattern-replay-explainability/replay",
    generate_explanation: "POST /pattern-replay-explainability/explain",
    retrieve_timeline: "POST /pattern-replay-explainability/timeline",
    navigate_evidence: "POST /pattern-replay-explainability/evidence",
    verify_replay: "POST /pattern-replay-explainability/verify",
    compare_replay: "POST /pattern-replay-explainability/compare",
    retrieve_registry: "POST /pattern-replay-explainability/registry",
    retrieve_contract: "GET /pattern-replay-explainability/contract",
    update_supported: false,
    delete_supported: false,
    historical_mutation_supported: false,
    autonomous_learning_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function findGovernanceRecord(ledgerResult: PatternLedgerResult, record: PatternLedgerRecord) {
  return ledgerResult.governance_result.governance_pattern_records.find((governanceRecord) => governanceRecord.pattern_id === record.pattern_id);
}

function buildReplayRecords(ledgerResult: PatternLedgerResult, scenario: Scenario): readonly PatternReplayRecord[] {
  if (scenario === "MISSING_LEDGER_INPUT") return freezeArray([]);
  return freezeArray(ledgerResult.ledger.records.map((record) => {
    const governanceRecord = findGovernanceRecord(ledgerResult, record);
    const evidenceRefs = scenario === "MISSING_EVIDENCE" ? freezeArray([]) : record.evidence_refs;
    const scoringRefs = scenario === "SCORING_MISMATCH" ? freezeArray([]) : record.scoring_refs;
    const governanceRefs = scenario === "GOVERNANCE_MISMATCH" ? freezeArray([]) : record.governance_review_refs;
    const recurrenceRefs = scenario === "RECURRENCE_MISMATCH" ? freezeArray([]) : record.recurrence_history_refs;
    const diverged = ["REPLAY_DIVERGENCE", "RECURRENCE_MISMATCH", "SCORING_MISMATCH", "GOVERNANCE_MISMATCH", "HASH_MISMATCH"].includes(scenario);
    const summary = scenario === "MISSING_EXPLANATION" ? "" : `Replay reconstructs ${record.pattern_id} from ledger sequence ${record.append_sequence} with evidence, scoring, governance, recurrence, and hash lineage.`;
    const base: Omit<PatternReplayRecord, "integrity_hash"> = {
      replay_id: `pattern_replay_${hash(`${record.ledger_record_id}:${record.integrity_hash}`).slice(0, 16)}`,
      pattern_id: record.pattern_id,
      tenant_id: scenario === "CROSS_TENANT" ? `${record.tenant_id}:foreign` : record.tenant_id,
      mission_scope: record.mission_scope,
      replay_timestamp: REPLAY_TIMESTAMP,
      replay_version: "pattern-replay/v1",
      replay_status: diverged ? "REPLAY_FAIL" : "REPLAY_PASS",
      replay_summary: summary,
      reconstructed_pattern_refs: freezeArray([record.pattern_id, record.ledger_record_id, ...(governanceRecord?.supporting_pattern_refs ?? [])]),
      reconstructed_evidence_refs: evidenceRefs,
      reconstructed_scoring_refs: scoringRefs,
      reconstructed_governance_refs: governanceRefs,
      reconstructed_recurrence_refs: recurrenceRefs,
      reconstructed_ledger_sequence: scenario === "TIMELINE_INCONSISTENCY" ? record.append_sequence + 1 : record.append_sequence,
      reconstructed_ledger_hash: scenario === "HASH_MISMATCH" ? hash("replay-hash-mismatch") : record.integrity_hash,
      timeline_refs: freezeArray([`${record.ledger_record_id}:timeline:detection`, `${record.ledger_record_id}:timeline:replay`]),
      explainability_refs: freezeArray([`${record.ledger_record_id}:explainability`]),
      replay_integrity_result: diverged ? "FAILED" : "VERIFIED",
      replay_divergence_detected: diverged,
      advisory_only: true,
      immutable: true,
      mutates_history: false,
      mutates_patterns: false,
      autonomous_learning: false,
    };
    const replayRecord = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
    if (scenario === "HISTORICAL_MUTATION") return Object.freeze({ ...replayRecord, mutates_history: true as false });
    if (scenario === "AUTONOMOUS_LEARNING") return Object.freeze({ ...replayRecord, autonomous_learning: true as false });
    return replayRecord;
  }));
}

function buildExplainabilityArtifacts(replayRecords: readonly PatternReplayRecord[], scenario: Scenario): readonly PatternExplainabilityArtifact[] {
  return freezeArray(replayRecords.map((record) => {
    const missing = scenario === "MISSING_EXPLANATION";
    const opaque = scenario === "OPAQUE_ARTIFACT";
    const base: Omit<PatternExplainabilityArtifact, "integrity_hash"> = {
      explainability_id: record.explainability_refs[0] ?? `${record.replay_id}:explainability`,
      replay_id: record.replay_id,
      pattern_id: record.pattern_id,
      tenant_id: record.tenant_id,
      why_detected: missing ? "" : `Pattern ${record.pattern_id} was detected from reconstructed pattern references.`,
      why_validated: missing ? "" : "Validation is preserved through ledger lineage and certified upstream validation references.",
      why_scored: missing ? "" : `Scoring is reconstructed from ${record.reconstructed_scoring_refs.join(", ")}.`,
      why_governance_reviewed: missing ? "" : `Governance review is reconstructed from ${record.reconstructed_governance_refs.join(", ")}.`,
      why_escalation_recommended: missing ? "" : "Escalation rationale is preserved as advisory governance intelligence.",
      why_replay_succeeded: missing ? "" : `Replay status is ${record.replay_status}.`,
      why_integrity_verified: missing ? "" : `Ledger hash ${record.reconstructed_ledger_hash} was reconstructed.`,
      evidence_refs: record.reconstructed_evidence_refs,
      scoring_refs: record.reconstructed_scoring_refs,
      governance_refs: record.reconstructed_governance_refs,
      replay_refs: record.timeline_refs,
      complete: !missing && !opaque,
      opaque,
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function timelineEvent(record: PatternReplayRecord, sequence: number, eventType: PatternTimelineEvent["event_type"], eventRef: string, scenario: Scenario): PatternTimelineEvent {
  const base: Omit<PatternTimelineEvent, "integrity_hash"> = {
    timeline_event_id: `${record.replay_id}:timeline:${sequence}`,
    pattern_id: record.pattern_id,
    tenant_id: record.tenant_id,
    sequence: scenario === "TIMELINE_INCONSISTENCY" && eventType === "REPLAY" ? 2 : sequence,
    event_type: eventType,
    event_ref: eventRef,
    event_summary: `${eventType} reconstructed for ${record.pattern_id}.`,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildTimelineEvents(replayRecords: readonly PatternReplayRecord[], scenario: Scenario): readonly PatternTimelineEvent[] {
  return freezeArray(replayRecords.flatMap((record) => [
    timelineEvent(record, 1, "DETECTION", record.reconstructed_pattern_refs[0] ?? record.pattern_id, scenario),
    timelineEvent(record, 2, "VALIDATION", record.reconstructed_evidence_refs[0] ?? record.pattern_id, scenario),
    timelineEvent(record, 3, "SCORING", record.reconstructed_scoring_refs[0] ?? record.pattern_id, scenario),
    timelineEvent(record, 4, "GOVERNANCE", record.reconstructed_governance_refs[0] ?? record.pattern_id, scenario),
    timelineEvent(record, 5, "LEDGER_APPEND", `${record.reconstructed_ledger_sequence}`, scenario),
    timelineEvent(record, 6, "REPLAY", record.replay_id, scenario),
  ]));
}

function buildEvidenceMaps(replayRecords: readonly PatternReplayRecord[], scenario: Scenario): readonly PatternEvidenceNavigationMap[] {
  return freezeArray(replayRecords.map((record) => {
    const evidenceRefs = scenario === "MISSING_EVIDENCE" ? freezeArray([]) : record.reconstructed_evidence_refs;
    const base: Omit<PatternEvidenceNavigationMap, "integrity_hash"> = {
      evidence_map_id: `${record.replay_id}:evidence-map`,
      pattern_id: record.pattern_id,
      tenant_id: record.tenant_id,
      decision_evidence_refs: evidenceRefs.slice(0, 1),
      recommendation_evidence_refs: evidenceRefs.slice(1, 2),
      outcome_evidence_refs: evidenceRefs.slice(2, 3),
      governance_evidence_refs: record.reconstructed_governance_refs,
      operator_evidence_refs: freezeArray([`${record.pattern_id}:operator-evidence`]),
      simulation_evidence_refs: freezeArray([`${record.pattern_id}:simulation-evidence`]),
      replay_evidence_refs: record.timeline_refs,
      truth_ledger_refs: freezeArray(evidenceRefs.map((ref) => `${ref}:truth-ledger`)),
      integrity_verified: evidenceRefs.length > 0,
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function buildComparisons(replayRecords: readonly PatternReplayRecord[], scenario: Scenario): readonly PatternReplayComparison[] {
  return freezeArray(replayRecords.map((record) => {
    const base: Omit<PatternReplayComparison, "integrity_hash"> = {
      comparison_id: `${record.replay_id}:comparison`,
      pattern_id: record.pattern_id,
      tenant_id: record.tenant_id,
      identity_match: true,
      evidence_match: scenario !== "MISSING_EVIDENCE",
      recurrence_match: scenario !== "RECURRENCE_MISMATCH",
      scoring_match: scenario !== "SCORING_MISMATCH",
      governance_match: scenario !== "GOVERNANCE_MISMATCH",
      ledger_sequence_match: scenario !== "TIMELINE_INCONSISTENCY",
      integrity_hash_match: scenario !== "HASH_MISMATCH",
      replay_pass: record.replay_status === "REPLAY_PASS" && !record.replay_divergence_detected,
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function buildRegistry(replayRecords: readonly PatternReplayRecord[], artifacts: readonly PatternExplainabilityArtifact[], timelineEvents: readonly PatternTimelineEvent[], evidenceMaps: readonly PatternEvidenceNavigationMap[], comparisons: readonly PatternReplayComparison[], ledgerResult: PatternLedgerResult, scenario: Scenario): PatternExplainabilityRegistry {
  const base: Omit<PatternExplainabilityRegistry, "integrity_hash"> = {
    registry_id: `pattern_explainability_registry_${hash(ledgerResult.ledger.ledger_id).slice(0, 14)}`,
    tenant_id: scenario === "CROSS_TENANT" ? `${ledgerResult.ledger.tenant_id}:foreign` : ledgerResult.ledger.tenant_id,
    replay_refs: replayRecords.map((record) => record.replay_id),
    explainability_refs: artifacts.map((artifact) => artifact.explainability_id),
    timeline_refs: timelineEvents.map((event) => event.timeline_event_id),
    evidence_map_refs: evidenceMaps.map((map) => map.evidence_map_id),
    comparison_refs: comparisons.map((comparison) => comparison.comparison_id),
    append_only: true,
    immutable: true,
    deleted: scenario === "REGISTRY_MUTATION",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function timelineOrdered(events: readonly PatternTimelineEvent[]): boolean {
  const byPattern = events.reduce((index, event) => {
    return { ...index, [event.pattern_id]: [...(index[event.pattern_id] ?? []), event.sequence] };
  }, {} as Record<string, number[]>);
  return Object.values(byPattern).every((sequences) => sequences.every((sequence, index) => index === 0 || sequence > sequences[index - 1]));
}

function collectFailures(ledgerResult: PatternLedgerResult, replayRecords: readonly PatternReplayRecord[], artifacts: readonly PatternExplainabilityArtifact[], timelineEvents: readonly PatternTimelineEvent[], evidenceMaps: readonly PatternEvidenceNavigationMap[], comparisons: readonly PatternReplayComparison[], registry: PatternExplainabilityRegistry, scenario: Scenario): readonly PatternReplayFailure[] {
  const failures: PatternReplayFailure[] = [];
  if (scenario === "MISSING_LEDGER_INPUT" || !replayRecords.length) failures.push("LEDGER_INPUT_MISSING");
  if (scenario === "UNCERTIFIED_LEDGER_INPUT" || !ledgerResult.validation.certified) failures.push("LEDGER_INPUT_UNCERTIFIED");
  if (scenario === "MISSING_REPLAY" || replayRecords.some((record) => !record.reconstructed_pattern_refs.length || !record.timeline_refs.length)) failures.push("REPLAY_REFERENCES_MISSING");
  if (scenario === "MISSING_EVIDENCE" || evidenceMaps.some((map) => !map.integrity_verified)) failures.push("EVIDENCE_UNAVAILABLE");
  if (scenario === "RECURRENCE_MISMATCH" || comparisons.some((comparison) => !comparison.recurrence_match)) failures.push("RECURRENCE_MISMATCH");
  if (scenario === "SCORING_MISMATCH" || comparisons.some((comparison) => !comparison.scoring_match)) failures.push("SCORING_MISMATCH");
  if (scenario === "GOVERNANCE_MISMATCH" || comparisons.some((comparison) => !comparison.governance_match)) failures.push("GOVERNANCE_MISMATCH");
  if (scenario === "TIMELINE_INCONSISTENCY" || !timelineOrdered(timelineEvents) || comparisons.some((comparison) => !comparison.ledger_sequence_match)) failures.push("TIMELINE_INCONSISTENCY");
  if (scenario === "HASH_MISMATCH" || replayRecords.some((record) => hashWithoutIntegrity(record) !== record.integrity_hash) || comparisons.some((comparison) => !comparison.integrity_hash_match)) failures.push("INTEGRITY_VERIFICATION_FAILED");
  if (scenario === "REPLAY_DIVERGENCE" || replayRecords.some((record) => record.replay_divergence_detected) || !replayPatternIntelligenceLedger(ledgerResult)) failures.push("REPLAY_DIVERGENCE_DETECTED");
  if (scenario === "CROSS_TENANT" || registry.tenant_id !== ledgerResult.ledger.tenant_id) failures.push("TENANT_BOUNDARY_VIOLATED");
  if (scenario === "MISSING_EXPLANATION" || artifacts.some((artifact) => !artifact.complete)) failures.push("EXPLANATION_MISSING");
  if (scenario === "OPAQUE_ARTIFACT" || artifacts.some((artifact) => artifact.opaque)) failures.push("OPAQUE_ARTIFACT_DETECTED");
  if (scenario === "REGISTRY_MUTATION" || registry.deleted) failures.push("REGISTRY_MUTATION_DETECTED");
  if (scenario === "HISTORICAL_MUTATION" || replayRecords.some((record) => record.mutates_history || record.mutates_patterns)) failures.push("HISTORICAL_MUTATION_DETECTED");
  if (scenario === "AUTONOMOUS_LEARNING" || replayRecords.some((record) => record.autonomous_learning)) failures.push("AUTONOMOUS_LEARNING_DETECTED");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateFor(failures: readonly PatternReplayFailure[]): PatternReplayValidation["state"] {
  if (failures.includes("EVIDENCE_UNAVAILABLE")) return "PENDING_EVIDENCE";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildValidation(replayRecords: readonly PatternReplayRecord[], artifacts: readonly PatternExplainabilityArtifact[], timelineEvents: readonly PatternTimelineEvent[], evidenceMaps: readonly PatternEvidenceNavigationMap[], registry: PatternExplainabilityRegistry, failures: readonly PatternReplayFailure[]): PatternReplayValidation {
  const integrityVerified = [
    ...replayRecords,
    ...artifacts,
    ...timelineEvents,
    ...evidenceMaps,
    registry,
  ].every((item) => hashWithoutIntegrity(item) === item.integrity_hash);
  const base: Omit<PatternReplayValidation, "integrity_hash"> = {
    validation_id: "pattern_replay_explainability_validation",
    state: stateFor(failures),
    certified: failures.length === 0 && integrityVerified,
    failures,
    ledger_input_accepted: !failures.includes("LEDGER_INPUT_MISSING") && !failures.includes("LEDGER_INPUT_UNCERTIFIED"),
    replay_references_complete: !failures.includes("REPLAY_REFERENCES_MISSING"),
    evidence_available: !failures.includes("EVIDENCE_UNAVAILABLE"),
    recurrence_reconstructed: !failures.includes("RECURRENCE_MISMATCH"),
    scoring_reconstructed: !failures.includes("SCORING_MISMATCH"),
    governance_reconstructed: !failures.includes("GOVERNANCE_MISMATCH"),
    timeline_ordering_valid: !failures.includes("TIMELINE_INCONSISTENCY"),
    integrity_verified: integrityVerified && !failures.includes("INTEGRITY_VERIFICATION_FAILED"),
    replay_divergence_absent: !failures.includes("REPLAY_DIVERGENCE_DETECTED"),
    tenant_isolated: !failures.includes("TENANT_BOUNDARY_VIOLATED"),
    explanations_complete: !failures.includes("EXPLANATION_MISSING") && !failures.includes("OPAQUE_ARTIFACT_DETECTED"),
    registry_immutable: registry.append_only && registry.immutable && !registry.deleted,
    advisory_only: replayRecords.every((record) => record.advisory_only),
    no_historical_mutation: replayRecords.every((record) => !record.mutates_history && !record.mutates_patterns),
    no_autonomous_learning: replayRecords.every((record) => !record.autonomous_learning),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<PatternReplayResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    ledger_replay_hash: result.ledger_result.replay_hash,
    replay_records: result.replay_records,
    explainability_artifacts: result.explainability_artifacts,
    timeline_events: result.timeline_events,
    evidence_navigation_maps: result.evidence_navigation_maps,
    comparisons: result.comparisons,
    registry: result.registry,
    validation: result.validation,
  });
}

function resultIntegrityHash(result: Omit<PatternReplayResult, "integrity_hash">): string {
  return hash({
    pattern_replay_explainability_version: result.pattern_replay_explainability_version,
    api_surface_hash: result.api_surface.integrity_hash,
    ledger_hash: result.ledger_result.integrity_hash,
    replay_hashes: result.replay_records.map((record) => record.integrity_hash),
    explainability_hashes: result.explainability_artifacts.map((artifact) => artifact.integrity_hash),
    registry_hash: result.registry.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    replay_hash: result.replay_hash,
    advisory_only: result.advisory_only,
    immutable: result.immutable,
  });
}

export function replayPatternExplainability(input: PatternReplayInput = {}): PatternReplayResult {
  const scenario = input.scenario ?? "BASELINE";
  const ledger_result = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const replay_records = buildReplayRecords(ledger_result, scenario);
  const explainability_artifacts = buildExplainabilityArtifacts(replay_records, scenario);
  const timeline_events = buildTimelineEvents(replay_records, scenario);
  const evidence_navigation_maps = buildEvidenceMaps(replay_records, scenario);
  const comparisons = buildComparisons(replay_records, scenario);
  const registry = buildRegistry(replay_records, explainability_artifacts, timeline_events, evidence_navigation_maps, comparisons, ledger_result, scenario);
  const failures = collectFailures(ledger_result, replay_records, explainability_artifacts, timeline_events, evidence_navigation_maps, comparisons, registry, scenario);
  const validation = buildValidation(replay_records, explainability_artifacts, timeline_events, evidence_navigation_maps, registry, failures);
  const base: Omit<PatternReplayResult, "integrity_hash" | "replay_hash"> = {
    pattern_replay_explainability_version: PATTERN_REPLAY_VERSION,
    ledger_result,
    api_surface,
    replay_records,
    explainability_artifacts,
    timeline_events,
    evidence_navigation_maps,
    comparisons,
    registry,
    validation,
    deterministic: true,
    replayable: true,
    explainable: true,
    evidence_based: true,
    governance_first: true,
    tenant_isolated: true,
    advisory_only: true,
    immutable: true,
    mutates_history: false,
    mutates_patterns: false,
    autonomous_learning: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function verifyPatternReplayExplainability(result: PatternReplayResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash && replayPatternIntelligenceLedger(result.ledger_result);
}

export function computePatternReplayHash(record: Omit<PatternReplayRecord, "integrity_hash"> | PatternReplayRecord): string {
  return hashWithoutIntegrity(record);
}

export function getPatternReplayExplainabilityFoundation(): PatternReplayFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    pattern_replay_explainability_version: PATTERN_REPLAY_VERSION,
    api_surface,
    result: replayPatternExplainability(),
  });
}

export const PatternReplayExplainability = Object.freeze({
  replay: replayPatternExplainability,
  verify: verifyPatternReplayExplainability,
});
