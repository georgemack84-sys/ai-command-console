import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import {
  CONFLICT_CATEGORIES,
  createConflictDetectionRule,
  registerConflict,
  validateConflict,
} from "@/services/decision-conflict-detection-contract";
import type {
  ConflictCategory,
  ConflictDetectionRule,
  ConflictRecord,
} from "@/types/decision-conflict-detection-contract";
import type {
  CandidateComparisonPair,
  ConflictDetectionCandidate,
  ConflictDetectionEngineFailureReason,
  ConflictDetectionEngineFoundation,
  ConflictDetectionEngineInput,
  ConflictDetectionEngineObservability,
  ConflictDetectionEngineReplay,
  ConflictDetectionEngineResult,
  ConflictDetectionLedgerRecord,
  ConflictDetectionRuleId,
  ConflictDetectionSignal,
} from "@/types/decision-conflict-detection-engine";

const NOW = "2026-07-03T23:15:00.000Z";
const ENGINE_VERSION = "conflict-detection-engine/v1" as const;
const AUTHORIZED_COMPONENT = "decision-conflict-detection-engine";

const RULE_CATEGORY: Readonly<Record<ConflictDetectionRuleId, ConflictCategory>> = Object.freeze({
  duplicate_recommendation_rule: "Recommendation",
  incompatible_action_rule: "Recommendation",
  policy_contradiction_rule: "Governance",
  conflicting_evidence_rule: "Evidence",
  authority_overlap_rule: "Authority",
  recovery_conflict_rule: "Recovery",
  timing_collision_rule: "Timing",
  forecast_divergence_rule: "Forecast",
  mission_objective_rule: "Mission Objective",
  certification_blocker_rule: "Certification",
});

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function normalizeStrings(values: readonly string[] | undefined): string[] {
  return [...new Set((values ?? []).filter((value) => value.length > 0))].sort();
}

function lower(value: string): string {
  return value.trim().toLowerCase();
}

function intersects(left: readonly string[], right: readonly string[]): boolean {
  const set = new Set(left);
  return right.some((value) => set.has(value));
}

function union(...groups: readonly (readonly string[])[]): string[] {
  return normalizeStrings(groups.flatMap((group) => [...group]));
}

export function createConflictDetectionEngineRules(): readonly ConflictDetectionRule[] {
  return Object.freeze((Object.entries(RULE_CATEGORY) as [ConflictDetectionRuleId, ConflictCategory][]).map(([rule_id, conflict_category]) => createConflictDetectionRule({
    rule_id,
    rule_name: rule_id.replaceAll("_", " "),
    rule_version: "conflict-detection-engine-rule/v1",
    conflict_category,
    evaluation_logic: `Deterministically evaluate ${conflict_category} comparison signals for validated decision candidate pairs.`,
    evidence_requirements: ["candidate_pair_evidence"],
    governance_requirements: ["governance_policy_binding"],
    authority_requirements: ["authority_boundary_binding"],
    replay_requirements: ["engine_pairwise_replay_snapshot"],
  })));
}

export function createConflictDetectionCandidate(input: Partial<ConflictDetectionCandidate> = {}): ConflictDetectionCandidate {
  const candidate_id = input.candidate_id ?? "candidate_alpha";
  return Object.freeze({
    candidate_id,
    tenant_id: input.tenant_id ?? "tenant_alpha",
    mission_id: input.mission_id ?? "mission_conflict_detection",
    status: input.status ?? "VALIDATED",
    decision_priority: input.decision_priority ?? 50,
    proposed_action: input.proposed_action ?? "reroute workload",
    expected_outcome: input.expected_outcome ?? "mission continuity preserved",
    execution_path: input.execution_path ?? "path_primary",
    governance_refs: Object.freeze(normalizeStrings(input.governance_refs ?? ["governance_policy_binding"])),
    policy_refs: Object.freeze(normalizeStrings(input.policy_refs ?? ["policy_primary"])),
    constitutional_refs: Object.freeze(normalizeStrings(input.constitutional_refs ?? ["constitutional_advisory_only", "constitutional_operator_supremacy"])),
    authority_refs: Object.freeze(normalizeStrings(input.authority_refs ?? ["authority_boundary_binding"])),
    evidence_refs: Object.freeze(normalizeStrings(input.evidence_refs ?? [`evidence_${candidate_id}`])),
    evidence_assertions: Object.freeze(normalizeStrings(input.evidence_assertions ?? ["system_load_high"])),
    risk_refs: Object.freeze(normalizeStrings(input.risk_refs ?? ["risk_operational_delay"])),
    confidence_score: input.confidence_score ?? 75,
    recovery_strategy: input.recovery_strategy ?? "rollback_primary",
    timing_window: input.timing_window ?? "window_1",
    forecast_outcome: input.forecast_outcome ?? "forecast_stable",
    mission_objective: input.mission_objective ?? "preserve_primary_objective",
    certification_refs: Object.freeze(normalizeStrings(input.certification_refs ?? ["certification_ready"])),
    certification_blockers: Object.freeze(normalizeStrings(input.certification_blockers ?? [])),
    replay_refs: Object.freeze(normalizeStrings(input.replay_refs ?? [`replay_${candidate_id}`])),
  });
}

export function scanConflictCandidates(input: ConflictDetectionEngineInput = {}): readonly ConflictDetectionCandidate[] {
  return Object.freeze([...(input.candidates ?? defaultCandidates())]
    .filter((candidate) => candidate.status === "VALIDATED")
    .filter((candidate) => !input.tenant_id || candidate.tenant_id === input.tenant_id)
    .filter((candidate) => !input.mission_id || candidate.mission_id === input.mission_id)
    .sort((a, b) => (
      a.tenant_id.localeCompare(b.tenant_id)
      || a.mission_id.localeCompare(b.mission_id)
      || b.decision_priority - a.decision_priority
      || a.candidate_id.localeCompare(b.candidate_id)
    )));
}

export function generateCandidateComparisonPairs(candidates: readonly ConflictDetectionCandidate[]): readonly CandidateComparisonPair[] {
  const pairs: CandidateComparisonPair[] = [];
  let comparison_order = 0;
  for (let leftIndex = 0; leftIndex < candidates.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < candidates.length; rightIndex += 1) {
      const left = candidates[leftIndex];
      const right = candidates[rightIndex];
      if (left.candidate_id === right.candidate_id) continue;
      if (left.tenant_id !== right.tenant_id || left.mission_id !== right.mission_id) continue;
      comparison_order += 1;
      const base: Omit<CandidateComparisonPair, "integrity_hash"> = {
        pair_id: `pair_${hash({ left: left.candidate_id, right: right.candidate_id, tenant_id: left.tenant_id, mission_id: left.mission_id }).slice(0, 24)}`,
        tenant_id: left.tenant_id,
        mission_id: left.mission_id,
        left_candidate_id: left.candidate_id,
        right_candidate_id: right.candidate_id,
        comparison_order,
      };
      pairs.push(Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) }));
    }
  }
  return Object.freeze(pairs);
}

function defaultCandidates(): readonly ConflictDetectionCandidate[] {
  return Object.freeze([
    createConflictDetectionCandidate({ candidate_id: "candidate_alpha", decision_priority: 90, proposed_action: "reroute workload", evidence_refs: ["evidence_shared"], policy_refs: ["policy_primary"] }),
    createConflictDetectionCandidate({ candidate_id: "candidate_beta", decision_priority: 80, proposed_action: "reroute workload", evidence_refs: ["evidence_shared"], policy_refs: ["policy_primary"] }),
    createConflictDetectionCandidate({ candidate_id: "candidate_gamma", decision_priority: 70, proposed_action: "shutdown subsystem", policy_refs: ["policy_no_shutdown"], execution_path: "path_shutdown" }),
  ]);
}

function candidateById(candidates: readonly ConflictDetectionCandidate[]): Map<string, ConflictDetectionCandidate> {
  return new Map(candidates.map((candidate) => [candidate.candidate_id, candidate]));
}

function signalHash(signal: Omit<ConflictDetectionSignal, "integrity_hash"> | ConflictDetectionSignal): string {
  return hashWithoutIntegrity(signal);
}

function buildSignal(
  pair: CandidateComparisonPair,
  left: ConflictDetectionCandidate,
  right: ConflictDetectionCandidate,
  rule_id: ConflictDetectionRuleId,
  reason: string,
  overrides: Partial<Pick<ConflictDetectionSignal, "evidence_refs" | "policy_refs" | "risk_refs" | "confidence_refs" | "forecast_refs" | "recovery_refs" | "certification_refs">> = {},
): ConflictDetectionSignal {
  const category = RULE_CATEGORY[rule_id];
  const base: Omit<ConflictDetectionSignal, "integrity_hash"> = {
    pair_id: pair.pair_id,
    rule_id,
    conflict_category: category,
    detection_reason: reason,
    candidate_refs: Object.freeze(normalizeStrings([left.candidate_id, right.candidate_id])),
    evidence_refs: Object.freeze(normalizeStrings(overrides.evidence_refs ?? union(left.evidence_refs, right.evidence_refs))),
    governance_refs: Object.freeze(union(left.governance_refs, right.governance_refs)),
    constitutional_refs: Object.freeze(union(left.constitutional_refs, right.constitutional_refs)),
    authority_refs: Object.freeze(union(left.authority_refs, right.authority_refs)),
    policy_refs: Object.freeze(normalizeStrings(overrides.policy_refs ?? union(left.policy_refs, right.policy_refs))),
    risk_refs: Object.freeze(normalizeStrings(overrides.risk_refs ?? union(left.risk_refs, right.risk_refs))),
    confidence_refs: Object.freeze(normalizeStrings(overrides.confidence_refs ?? [`confidence_${left.candidate_id}_${left.confidence_score}`, `confidence_${right.candidate_id}_${right.confidence_score}`])),
    forecast_refs: Object.freeze(normalizeStrings(overrides.forecast_refs ?? [left.forecast_outcome, right.forecast_outcome])),
    resource_refs: Object.freeze([]),
    recovery_refs: Object.freeze(normalizeStrings(overrides.recovery_refs ?? [left.recovery_strategy, right.recovery_strategy])),
    certification_refs: Object.freeze(normalizeStrings(overrides.certification_refs ?? union(left.certification_refs, right.certification_refs, left.certification_blockers, right.certification_blockers))),
    replay_ref: `replay_${pair.pair_id}_${rule_id}`,
    lineage_ref: `lineage_${pair.pair_id}_${rule_id}`,
  };
  return Object.freeze({ ...base, integrity_hash: signalHash(base) });
}

function oppositeAction(left: string, right: string): boolean {
  const a = lower(left);
  const b = lower(right);
  return (a.includes("shutdown") && (b.includes("start") || b.includes("continue") || b.includes("reroute")))
    || (b.includes("shutdown") && (a.includes("start") || a.includes("continue") || a.includes("reroute")))
    || (a.includes("approve") && b.includes("reject"))
    || (b.includes("approve") && a.includes("reject"));
}

function contradiction(left: readonly string[], right: readonly string[]): boolean {
  return left.some((l) => right.some((r) => {
    const a = lower(l);
    const b = lower(r);
    return (a.includes("allow") && b.includes("deny"))
      || (a.includes("deny") && b.includes("allow"))
      || (a.includes("true") && b.includes("false"))
      || (a.includes("false") && b.includes("true"))
      || (a.includes("required") && b.includes("prohibited"))
      || (a.includes("prohibited") && b.includes("required"));
  }));
}

export function compareCandidatePair(
  pair: CandidateComparisonPair,
  candidates: readonly ConflictDetectionCandidate[],
): readonly ConflictDetectionSignal[] {
  const byId = candidateById(candidates);
  const left = byId.get(pair.left_candidate_id);
  const right = byId.get(pair.right_candidate_id);
  if (!left || !right) return Object.freeze([]);
  const signals: ConflictDetectionSignal[] = [];

  if (lower(left.proposed_action) === lower(right.proposed_action) && intersects(left.evidence_refs, right.evidence_refs) && sameSet(left.governance_refs, right.governance_refs)) {
    signals.push(buildSignal(pair, left, right, "duplicate_recommendation_rule", "Candidates propose the same action with materially identical evidence and governance."));
  }
  if (oppositeAction(left.proposed_action, right.proposed_action) || contradiction([left.execution_path], [right.execution_path])) {
    signals.push(buildSignal(pair, left, right, "incompatible_action_rule", "Candidates require mutually exclusive actions or execution paths."));
  }
  if (contradiction(left.policy_refs, right.policy_refs) || contradiction(left.governance_refs, right.governance_refs)) {
    signals.push(buildSignal(pair, left, right, "policy_contradiction_rule", "Candidates reference contradictory governance policies."));
  }
  if (contradiction(left.evidence_assertions, right.evidence_assertions)) {
    signals.push(buildSignal(pair, left, right, "conflicting_evidence_rule", "Candidate evidence assertions are mutually exclusive."));
  }
  if (intersects(left.authority_refs, right.authority_refs) && lower(left.proposed_action) !== lower(right.proposed_action)) {
    signals.push(buildSignal(pair, left, right, "authority_overlap_rule", "Candidates require overlapping approval ownership for different actions."));
  }
  if (left.recovery_strategy !== right.recovery_strategy && contradiction([left.recovery_strategy], [right.recovery_strategy])) {
    signals.push(buildSignal(pair, left, right, "recovery_conflict_rule", "Candidates define incompatible rollback or recovery paths."));
  }
  if (left.timing_window === right.timing_window && lower(left.proposed_action) !== lower(right.proposed_action)) {
    signals.push(buildSignal(pair, left, right, "timing_collision_rule", "Candidates compete for the same execution window."));
  }
  if (left.forecast_outcome !== right.forecast_outcome && contradiction([left.forecast_outcome], [right.forecast_outcome])) {
    signals.push(buildSignal(pair, left, right, "forecast_divergence_rule", "Candidates produce incompatible forecast outcomes."));
  }
  if (left.mission_objective !== right.mission_objective && contradiction([left.mission_objective], [right.mission_objective])) {
    signals.push(buildSignal(pair, left, right, "mission_objective_rule", "Candidates advance incompatible mission objectives."));
  }
  if (left.certification_blockers.length > 0 || right.certification_blockers.length > 0 || contradiction(left.certification_refs, right.certification_refs)) {
    signals.push(buildSignal(pair, left, right, "certification_blocker_rule", "Candidates include unmet or contradictory certification requirements."));
  }

  return Object.freeze(signals.sort((a, b) => a.rule_id.localeCompare(b.rule_id)));
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  const a = normalizeStrings(left);
  const b = normalizeStrings(right);
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function validateCandidates(candidates: readonly ConflictDetectionCandidate[], input: ConflictDetectionEngineInput): ConflictDetectionEngineFailureReason[] {
  const failures: ConflictDetectionEngineFailureReason[] = [];
  if (candidates.length === 0) failures.push("NO_CANDIDATES");
  const ids = candidates.map((candidate) => candidate.candidate_id);
  if (new Set(ids).size !== ids.length) failures.push("DUPLICATE_CANDIDATE_IDENTIFIER");
  for (const candidate of candidates) {
    if (!candidate.candidate_id || !candidate.tenant_id || !candidate.mission_id || !candidate.governance_refs.length || !candidate.evidence_refs.length || !candidate.replay_refs.length) failures.push("CANDIDATE_SCHEMA_INVALID");
    if (input.tenant_id && candidate.tenant_id !== input.tenant_id) failures.push("CROSS_TENANT_CANDIDATE");
    if (input.mission_id && candidate.mission_id !== input.mission_id) failures.push("CROSS_MISSION_CANDIDATE");
  }
  return [...new Set(failures)];
}

function validateOrdering(candidates: readonly ConflictDetectionCandidate[], pairs: readonly CandidateComparisonPair[]): boolean {
  const rescanned = [...candidates].sort((a, b) => (
    a.tenant_id.localeCompare(b.tenant_id)
    || a.mission_id.localeCompare(b.mission_id)
    || b.decision_priority - a.decision_priority
    || a.candidate_id.localeCompare(b.candidate_id)
  ));
  const ordered = rescanned.every((candidate, index) => candidate.candidate_id === candidates[index]?.candidate_id);
  const pairOrder = pairs.every((pair, index) => pair.comparison_order === index + 1 && hashWithoutIntegrity(pair) === pair.integrity_hash);
  return ordered && pairOrder;
}

function signalKey(signal: ConflictDetectionSignal): string {
  return [signal.pair_id, signal.rule_id, signal.conflict_category, signalHash(signal)].join("|");
}

function registerSignal(signal: ConflictDetectionSignal, existingConflictIds: readonly string[]): ConflictRecord | undefined {
  const result = registerConflict({
    tenant_id: signal.candidate_refs[0]?.includes("tenant_beta") ? "tenant_beta" : undefined,
    mission_id: undefined,
    conflict_category: signal.conflict_category,
    candidate_refs: signal.candidate_refs,
    evidence_refs: signal.evidence_refs,
    governance_refs: signal.governance_refs,
    constitutional_refs: signal.constitutional_refs,
    authority_refs: signal.authority_refs,
    policy_refs: signal.policy_refs,
    risk_refs: signal.risk_refs,
    confidence_refs: signal.confidence_refs,
    forecast_refs: signal.forecast_refs,
    resource_refs: signal.resource_refs,
    recovery_refs: signal.recovery_refs,
    certification_refs: signal.certification_refs,
    detection_reason: signal.detection_reason,
    detection_rule: createConflictDetectionRule({ rule_id: signal.rule_id, conflict_category: signal.conflict_category }),
    replay_ref: signal.replay_ref,
    lineage_ref: signal.lineage_ref,
    existing_conflict_ids: existingConflictIds,
  });
  return result.conflict;
}

function ledgerHash(record: Omit<ConflictDetectionLedgerRecord, "integrity_hash"> | ConflictDetectionLedgerRecord): string {
  return hashWithoutIntegrity(record);
}

function writeLedger(conflict: ConflictRecord, signal: ConflictDetectionSignal): ConflictDetectionLedgerRecord {
  const base: Omit<ConflictDetectionLedgerRecord, "integrity_hash"> = {
    detection_id: `detection_${conflict.conflict_id}`,
    conflict_id: conflict.conflict_id,
    tenant_id: conflict.tenant_id,
    mission_id: conflict.mission_id,
    candidate_refs: conflict.candidate_refs,
    comparison_pair: signal.pair_id,
    conflict_category: conflict.conflict_category,
    detection_rule: signal.rule_id,
    evidence_refs: conflict.evidence_refs,
    governance_refs: conflict.governance_refs,
    constitutional_refs: conflict.constitutional_refs,
    authority_refs: conflict.authority_refs,
    replay_ref: conflict.replay_ref,
    detection_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: ledgerHash(base) });
}

function replayHash(result: Omit<ConflictDetectionEngineResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    candidate_order: result.candidates_scanned.map((candidate) => candidate.candidate_id),
    comparison_pairs: result.comparison_pairs,
    signals: result.signals,
    conflicts: result.conflicts,
    validations: result.validations,
    ledger_records: result.ledger_records,
    failures: result.failures,
  });
}

function failResult(failures: readonly ConflictDetectionEngineFailureReason[], scanned: readonly ConflictDetectionCandidate[] = []): ConflictDetectionEngineResult {
  const base: Omit<ConflictDetectionEngineResult, "integrity_hash" | "replay_hash"> = {
    detection_status: "FAIL",
    fail_closed: true,
    candidates_scanned: Object.freeze([...scanned]),
    comparison_pairs: Object.freeze([]),
    signals: Object.freeze([]),
    conflicts: Object.freeze([]),
    validations: Object.freeze([]),
    ledger_records: Object.freeze([]),
    duplicate_conflict_refs: Object.freeze([]),
    failures: Object.freeze([...new Set(failures)]),
    advisory_only: true,
    deterministic: true,
  };
  const replay_hash = replayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function detectDecisionCandidateConflicts(input: ConflictDetectionEngineInput = {}): ConflictDetectionEngineResult {
  if (input.authorized_component && input.authorized_component !== AUTHORIZED_COMPONENT) return failResult(["UNAUTHORIZED_COMPONENT"]);
  const scanned = scanConflictCandidates(input);
  const candidateFailures = validateCandidates(scanned, input);
  if (candidateFailures.length > 0) return failResult(candidateFailures, scanned);
  const pairs = generateCandidateComparisonPairs(scanned);
  if (!validateOrdering(scanned, pairs)) return failResult(["INVALID_COMPARISON_ORDERING"], scanned);

  const rawSignals = Object.freeze(pairs.flatMap((pair) => compareCandidatePair(pair, scanned)));
  const dedupedSignals: ConflictDetectionSignal[] = [];
  const duplicateRefs: string[] = [];
  const seenSignals = new Set<string>();
  for (const signal of rawSignals) {
    const key = signalKey(signal);
    if (seenSignals.has(key)) {
      duplicateRefs.push(key);
      continue;
    }
    seenSignals.add(key);
    dedupedSignals.push(signal);
  }

  const conflicts: ConflictRecord[] = [];
  const existingConflictIds: string[] = [];
  for (const signal of dedupedSignals) {
    const conflict = registerSignal(signal, existingConflictIds);
    if (!conflict) return failResult(["REQUIRED_FIELD_MISSING"], scanned);
    if (existingConflictIds.includes(conflict.conflict_id)) {
      duplicateRefs.push(conflict.conflict_id);
      continue;
    }
    existingConflictIds.push(conflict.conflict_id);
    conflicts.push(conflict);
  }

  const validations = Object.freeze(conflicts.map((conflict) => validateConflict(conflict)));
  if (validations.some((validation) => validation.validation_state !== "VALID")) {
    return failResult(validations.flatMap((validation) => validation.failures), scanned);
  }
  const ledger_records = Object.freeze(conflicts.map((conflict) => {
    const signal = dedupedSignals.find((item) => item.candidate_refs.every((ref) => conflict.candidate_refs.includes(ref)) && item.conflict_category === conflict.conflict_category);
    if (!signal) throw new Error("detection ledger signal unavailable");
    return writeLedger(conflict, signal);
  }));
  if (ledger_records.some((record) => ledgerHash(record) !== record.integrity_hash)) return failResult(["LEDGER_WRITE_FAILED"], scanned);

  const base: Omit<ConflictDetectionEngineResult, "integrity_hash" | "replay_hash"> = {
    detection_status: "PASS",
    fail_closed: false,
    candidates_scanned: scanned,
    comparison_pairs: pairs,
    signals: Object.freeze(dedupedSignals),
    conflicts: Object.freeze(conflicts.sort((a, b) => a.conflict_id.localeCompare(b.conflict_id))),
    validations,
    ledger_records,
    duplicate_conflict_refs: Object.freeze(normalizeStrings(duplicateRefs)),
    failures: Object.freeze([]),
    advisory_only: true,
    deterministic: true,
  };
  const replay_hash = replayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) return failResult(["ENGINE_REPLAY_MISMATCH"], scanned);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayConflictDetectionEngine(result: ConflictDetectionEngineResult): ConflictDetectionEngineReplay {
  const reconstructed = replayHash(result);
  const replay_valid = result.replay_hash === reconstructed && result.ledger_records.every((record) => ledgerHash(record) === record.integrity_hash);
  const failures: ConflictDetectionEngineFailureReason[] = replay_valid ? [] : ["ENGINE_REPLAY_MISMATCH"];
  const base: Omit<ConflictDetectionEngineReplay, "integrity_hash"> = {
    replay_id: "replay_conflict_detection_engine",
    replay_valid,
    candidate_order: Object.freeze(result.candidates_scanned.map((candidate) => candidate.candidate_id)),
    comparison_pair_refs: Object.freeze(result.comparison_pairs.map((pair) => pair.pair_id)),
    signal_refs: Object.freeze(result.signals.map((signal) => `${signal.pair_id}:${signal.rule_id}`)),
    conflict_refs: Object.freeze(result.conflicts.map((conflict) => conflict.conflict_id)),
    ledger_refs: Object.freeze(result.ledger_records.map((record) => record.detection_id)),
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function rate(count: number, total: number): number {
  return total === 0 ? 0 : Number((count / total).toFixed(6));
}

function categoryCounts(conflicts: readonly ConflictRecord[]): Record<ConflictCategory, number> {
  return Object.freeze(CONFLICT_CATEGORIES.reduce((counts, category) => {
    counts[category] = conflicts.filter((conflict) => conflict.conflict_category === category).length;
    return counts;
  }, {} as Record<ConflictCategory, number>));
}

export function buildConflictDetectionEngineObservability(result: ConflictDetectionEngineResult): ConflictDetectionEngineObservability {
  const total = result.conflicts.length;
  return Object.freeze({
    candidates_scanned: result.candidates_scanned.length,
    candidate_pairs_generated: result.comparison_pairs.length,
    comparisons_completed: result.comparison_pairs.length,
    conflicts_detected: result.conflicts.length,
    conflicts_by_category: categoryCounts(result.conflicts),
    duplicate_recommendation_rate: rate(result.conflicts.filter((conflict) => conflict.detection_rule_id === "duplicate_recommendation_rule").length, total),
    authority_conflict_rate: rate(result.conflicts.filter((conflict) => conflict.conflict_category === "Authority").length, total),
    evidence_conflict_rate: rate(result.conflicts.filter((conflict) => conflict.conflict_category === "Evidence").length, total),
    policy_contradiction_rate: rate(result.conflicts.filter((conflict) => conflict.detection_rule_id === "policy_contradiction_rule").length, total),
    replay_success_rate: replayConflictDetectionEngine(result).replay_valid ? 1 : 0,
    validation_failures: result.validations.filter((validation) => validation.validation_state !== "VALID").length,
    integrity_failures: result.conflicts.filter((conflict) => validateConflict(conflict).failures.includes("INTEGRITY_HASH_MISMATCH")).length,
  });
}

export function getConflictDetectionEngineFoundation(): ConflictDetectionEngineFoundation {
  const result = detectDecisionCandidateConflicts();
  const replay = replayConflictDetectionEngine(result);
  return Object.freeze({
    engine_version: ENGINE_VERSION,
    rules: createConflictDetectionEngineRules(),
    result,
    replay,
    observability: buildConflictDetectionEngineObservability(result),
  });
}

export const ConflictDetectionEngine = Object.freeze({
  scan: scanConflictCandidates,
  pair: generateCandidateComparisonPairs,
  compare: compareCandidatePair,
  detect: detectDecisionCandidateConflicts,
  replay: replayConflictDetectionEngine,
});
