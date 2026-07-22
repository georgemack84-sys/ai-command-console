import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";
import { createDecisionPriority } from "@/services/decision-priority-contract";
import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type { DecisionPriority, DecisionPriorityFactorName, DecisionPriorityState } from "@/types/decision-priority-contract";
import type {
  CompositePriorityScore,
  ConstraintOutcome,
  PriorityRankingRecord,
  PriorityScoringCandidateInput,
  PriorityScoringEngineInput,
  PriorityScoringEngineResult,
  PriorityScoringExplanation,
  PriorityScoringFailureReason,
  PriorityScoringLedgerRecord,
  PriorityScoringObservability,
  PriorityScoringReplayRecord,
  PriorityWeightProfile,
} from "@/types/decision-priority-scoring-engine";

const NOW = "2026-07-03T09:57:00.000Z";
const ENGINE_VERSION = "priority-scoring-engine/v1";

const FACTORS: readonly DecisionPriorityFactorName[] = Object.freeze([
  "mission_score",
  "urgency_score",
  "risk_score",
  "confidence_score",
  "governance_score",
  "runtime_score",
  "recovery_score",
  "forecast_score",
  "operator_score",
  "dependency_score",
]);

const STATE_ORDER: Readonly<Record<DecisionPriorityState, number>> = Object.freeze({
  CRITICAL: 0,
  HIGH: 1,
  MODERATE: 2,
  LOW: 3,
  DEFERRED: 4,
  BLOCKED: 5,
  REJECTED: 6,
});

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function recordHash<T extends Record<string, unknown>>(value: T): string {
  const copy = { ...value };
  delete copy.integrity_hash;
  return hash(copy);
}

function normalizeStrings(values: readonly string[] | undefined): string[] {
  return [...new Set((values ?? []).filter((value) => value.length > 0))].sort();
}

function defaultCandidate(): DecisionCandidate {
  const normalized = normalizeDecisionCandidateInput();
  if (!normalized.candidate) throw new Error("default normalized decision candidate unavailable");
  return normalized.candidate;
}

function defaultScores(candidate: DecisionCandidate): Record<DecisionPriorityFactorName, number> {
  return {
    mission_score: 80,
    urgency_score: candidate.operator_required ? 85 : 55,
    risk_score: candidate.risk_refs.length > 0 ? 72 : 40,
    confidence_score: candidate.confidence_refs.length > 0 ? 78 : 60,
    governance_score: candidate.governance_refs.length > 0 ? 82 : 0,
    runtime_score: candidate.decision_type.includes("EXECUTION") ? 75 : 50,
    recovery_score: candidate.proposed_action.toLowerCase().includes("recover") ? 85 : 45,
    forecast_score: 70,
    operator_score: candidate.operator_required ? 90 : 50,
    dependency_score: candidate.evidence_refs.length >= 2 ? 65 : 45,
  };
}

function weightKey(factor: DecisionPriorityFactorName): keyof Pick<PriorityWeightProfile, "mission_weight" | "urgency_weight" | "risk_weight" | "confidence_weight" | "governance_weight" | "runtime_weight" | "recovery_weight" | "forecast_weight" | "operator_weight" | "dependency_weight"> {
  return factor.replace("_score", "_weight") as ReturnType<typeof weightKey>;
}

function profileWithoutHash(profile: PriorityWeightProfile): Omit<PriorityWeightProfile, "integrity_hash"> {
  const { integrity_hash: _integrityHash, ...rest } = profile;
  void _integrityHash;
  return rest;
}

export function createPriorityWeightProfile(input: Partial<Omit<PriorityWeightProfile, "integrity_hash">> = {}): PriorityWeightProfile {
  const base: Omit<PriorityWeightProfile, "integrity_hash"> = {
    weight_profile_id: input.weight_profile_id ?? "priority_weight_profile_default_v1",
    tenant_id: input.tenant_id ?? "tenant_alpha",
    mission_scope: input.mission_scope ?? "mission_alpha",
    profile_version: input.profile_version ?? "priority-weight-profile/v1",
    mission_weight: input.mission_weight ?? 0.1,
    urgency_weight: input.urgency_weight ?? 0.1,
    risk_weight: input.risk_weight ?? 0.1,
    confidence_weight: input.confidence_weight ?? 0.1,
    governance_weight: input.governance_weight ?? 0.1,
    runtime_weight: input.runtime_weight ?? 0.1,
    recovery_weight: input.recovery_weight ?? 0.1,
    forecast_weight: input.forecast_weight ?? 0.1,
    operator_weight: input.operator_weight ?? 0.1,
    dependency_weight: input.dependency_weight ?? 0.1,
    governance_override_rules: normalizeStrings(input.governance_override_rules ?? ["constitutional_visibility_elevation", "governance_conflict_review"]),
    confidence_restriction_rules: normalizeStrings(input.confidence_restriction_rules ?? ["low_confidence_restricts_elevation"]),
    blocked_state_rules: normalizeStrings(input.blocked_state_rules ?? ["missing_dependency_blocks", "integrity_failure_rejects"]),
    effective_from: input.effective_from ?? "2026-07-03T00:00:00.000Z",
    effective_until: input.effective_until ?? "2027-07-03T00:00:00.000Z",
    governance_refs: normalizeStrings(input.governance_refs ?? ["governance_priority_weight_profile_v1"]),
    replay_refs: normalizeStrings(input.replay_refs ?? ["replay_priority_weight_profile_v1"]),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function candidateFromInput(input: PriorityScoringCandidateInput | undefined): DecisionCandidate {
  const base = input?.candidate ?? defaultCandidate();
  if (!input?.decision_candidate_id && !input?.tenant_id && !input?.mission_id) return base;
  const adjusted: DecisionCandidate = {
    ...base,
    candidate_id: input.decision_candidate_id ?? base.candidate_id,
    tenant_id: input.tenant_id ?? base.tenant_id,
    mission_id: input.mission_id ?? base.mission_id,
  };
  return Object.freeze({ ...adjusted, integrity_hash: hash({ ...adjusted, integrity_hash: undefined }) });
}

function scoreSet(input: PriorityScoringCandidateInput, candidate: DecisionCandidate): Partial<Record<DecisionPriorityFactorName, number>> {
  return Object.freeze({
    ...defaultScores(candidate),
    ...(input.scores ?? {}),
  });
}

function scoreComplete(scores: Partial<Record<DecisionPriorityFactorName, number>>): boolean {
  return FACTORS.every((factor) => scores[factor] !== undefined);
}

function scoresInRange(scores: Partial<Record<DecisionPriorityFactorName, number>>): boolean {
  return FACTORS.every((factor) => {
    const value = scores[factor];
    return value !== undefined && Number.isFinite(value) && value >= 0 && value <= 100;
  });
}

function weightValues(profile: PriorityWeightProfile): number[] {
  return FACTORS.map((factor) => profile[weightKey(factor)]);
}

function weightsNormalized(profile: PriorityWeightProfile): boolean {
  const total = weightValues(profile).reduce((sum, weight) => sum + weight, 0);
  return Math.abs(total - 1) < 0.000001;
}

function profileValid(profile: PriorityWeightProfile): PriorityScoringFailureReason[] {
  const failures: PriorityScoringFailureReason[] = [];
  if (!profile) failures.push("WEIGHT_PROFILE_MISSING");
  if (profile.profile_version !== "priority-weight-profile/v1") failures.push("WEIGHT_PROFILE_VERSION_UNKNOWN");
  if (weightValues(profile).some((weight) => !Number.isFinite(weight) || weight < 0 || weight > 1)) failures.push("WEIGHT_OUT_OF_RANGE");
  if (!weightsNormalized(profile)) failures.push("WEIGHTS_NOT_NORMALIZED");
  if (profile.governance_override_rules.length === 0) failures.push("GOVERNANCE_OVERRIDES_MISSING");
  if (profile.replay_refs.length === 0) failures.push("REPLAY_REFERENCES_MISSING");
  if (profile.integrity_hash !== recordHash(profileWithoutHash(profile))) failures.push("INTEGRITY_HASH_INVALID");
  return failures;
}

function tenantLeak(values: readonly string[], tenantId: string): boolean {
  return values.some((value) => value.includes("tenant_beta") && tenantId !== "tenant_beta");
}

function constraints(input: PriorityScoringCandidateInput, scores: Partial<Record<DecisionPriorityFactorName, number>>): readonly ConstraintOutcome[] {
  const outcomes: ConstraintOutcome[] = ["ALLOW_RANKING"];
  if (input.low_confidence_review_required || (scores.confidence_score ?? 100) < 45) outcomes.push("ALLOW_WITH_REVIEW", "RESTRICT_ELEVATION");
  if (input.constitutional_violation || input.governance_conflict) outcomes.push("ELEVATE_VISIBILITY");
  if (input.certification_blocker || input.dependency_missing || input.blocked) outcomes.push("BLOCK_RANKING");
  if (input.schema_or_integrity_invalid || input.rejected) outcomes.push("REJECT_CANDIDATE");
  return Object.freeze([...new Set(outcomes)]);
}

function composite(scores: Record<DecisionPriorityFactorName, number>, profile: PriorityWeightProfile): { total: number; contributions: Record<DecisionPriorityFactorName, number> } {
  const contributions = Object.fromEntries(FACTORS.map((factor) => [factor, Number((scores[factor] * profile[weightKey(factor)]).toFixed(6))])) as Record<DecisionPriorityFactorName, number>;
  const total = Number(FACTORS.reduce((sum, factor) => sum + contributions[factor], 0).toFixed(6));
  return { total, contributions };
}

function stateFromScore(total: number, applied: readonly ConstraintOutcome[]): DecisionPriorityState {
  if (applied.includes("REJECT_CANDIDATE")) return "REJECTED";
  if (applied.includes("BLOCK_RANKING")) return "BLOCKED";
  if (applied.includes("ELEVATE_VISIBILITY") && !applied.includes("RESTRICT_ELEVATION")) return "CRITICAL";
  if (total >= 85) return "CRITICAL";
  if (total >= 70) return "HIGH";
  if (total >= 40) return applied.includes("RESTRICT_ELEVATION") ? "MODERATE" : "MODERATE";
  if (total >= 1) return "LOW";
  return "DEFERRED";
}

function collectFailures(input: PriorityScoringEngineInput, profile: PriorityWeightProfile, entries: readonly {
  candidate: DecisionCandidate;
  scores: Partial<Record<DecisionPriorityFactorName, number>>;
  governance_refs: readonly string[];
  replay_refs: readonly string[];
}[]): PriorityScoringFailureReason[] {
  const failures: PriorityScoringFailureReason[] = [];
  if ((input.hidden_ranking_refs ?? []).length > 0) failures.push("HIDDEN_RANKING_LOGIC_DETECTED");
  if (input.tie_break_reproducible === false) failures.push("TIE_BREAK_ORDERING_UNREPRODUCIBLE");
  failures.push(...profileValid(profile));
  for (const entry of entries) {
    if (!scoreComplete(entry.scores)) failures.push("REQUIRED_FACTOR_SCORE_MISSING");
    if (!scoresInRange(entry.scores)) failures.push("SCORE_OUT_OF_RANGE");
    if (entry.governance_refs.length === 0) failures.push("GOVERNANCE_REFERENCES_MISSING");
    if (entry.replay_refs.length === 0) failures.push("REPLAY_REFERENCES_MISSING");
    if (tenantLeak([...entry.governance_refs, ...entry.replay_refs], entry.candidate.tenant_id)) failures.push("CROSS_TENANT_REFERENCE_DETECTED");
  }
  return failures;
}

function buildScore(candidate: DecisionCandidate, scores: Record<DecisionPriorityFactorName, number>, profile: PriorityWeightProfile, applied: readonly ConstraintOutcome[], refs: { evidence_refs: readonly string[]; governance_refs: readonly string[]; replay_refs: readonly string[] }): CompositePriorityScore {
  const calculated = composite(scores, profile);
  const priorityState = stateFromScore(calculated.total, applied);
  const base: Omit<CompositePriorityScore, "integrity_hash"> = {
    score_id: `composite_priority_${candidate.candidate_id}`,
    decision_candidate_id: candidate.candidate_id,
    ...scores,
    weight_profile_id: profile.weight_profile_id,
    overall_priority_score: calculated.total,
    factor_contribution_breakdown: Object.freeze(calculated.contributions),
    applied_constraints: applied,
    priority_state: priorityState,
    explanation_ref: `priority_scoring_explanation_${candidate.candidate_id}`,
    evidence_refs: refs.evidence_refs,
    governance_refs: refs.governance_refs,
    replay_refs: refs.replay_refs,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function tieBreakFields(score: CompositePriorityScore): readonly number[] {
  return [
    score.governance_score,
    score.mission_score,
    score.risk_score,
    score.urgency_score,
    score.dependency_score,
    score.runtime_score,
    score.recovery_score,
    score.forecast_score,
    score.confidence_score,
  ];
}

function sortScores(scores: readonly CompositePriorityScore[]): CompositePriorityScore[] {
  return [...scores].sort((a, b) => {
    const stateDelta = STATE_ORDER[a.priority_state] - STATE_ORDER[b.priority_state];
    if (stateDelta !== 0) return stateDelta;
    const scoreDelta = b.overall_priority_score - a.overall_priority_score;
    if (Math.abs(scoreDelta) > 0.000001) return scoreDelta;
    const aFields = tieBreakFields(a);
    const bFields = tieBreakFields(b);
    for (let index = 0; index < aFields.length; index += 1) {
      const delta = bFields[index] - aFields[index];
      if (delta !== 0) return delta;
    }
    return a.decision_candidate_id.localeCompare(b.decision_candidate_id);
  });
}

function buildRanking(score: CompositePriorityScore, candidate: DecisionCandidate, rank: number | null, profile: PriorityWeightProfile): PriorityRankingRecord {
  const tieFields = Object.freeze(["governance_score", "mission_score", "risk_score", "urgency_score", "dependency_score", "runtime_score", "recovery_score", "forecast_score", "confidence_score", "decision_candidate_id"]);
  const base: Omit<PriorityRankingRecord, "integrity_hash"> = {
    ranking_id: `priority_ranking_${candidate.tenant_id}_${candidate.mission_id}_${score.decision_candidate_id}`,
    tenant_id: candidate.tenant_id,
    mission_id: candidate.mission_id,
    ranking_order: rank,
    rank_position: rank,
    decision_candidate_id: score.decision_candidate_id,
    priority_state: score.priority_state,
    overall_priority_score: score.overall_priority_score,
    tie_break_result: rank === null ? `${score.priority_state} excluded from active ranking.` : `Rank ${rank} resolved by deterministic state, score, and tie-break order.`,
    tie_break_fields_used: tieFields,
    scoring_profile_ref: profile.weight_profile_id,
    explanation_ref: score.explanation_ref,
    governance_refs: score.governance_refs,
    replay_refs: score.replay_refs,
    created_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildExplanation(score: CompositePriorityScore, ranking: PriorityRankingRecord): PriorityScoringExplanation {
  const base: Omit<PriorityScoringExplanation, "integrity_hash"> = {
    explanation_id: score.explanation_ref,
    decision_candidate_id: score.decision_candidate_id,
    score_rationale: `Overall priority score ${score.overall_priority_score}.`,
    weight_rationale: `Weight profile ${score.weight_profile_id} applied across canonical factors.`,
    governance_rationale: `Governance score ${score.governance_score} contributes ${score.factor_contribution_breakdown.governance_score}.`,
    confidence_rationale: score.applied_constraints.includes("RESTRICT_ELEVATION") ? "Low confidence restricts elevation without review." : `Confidence score ${score.confidence_score} contributes ${score.factor_contribution_breakdown.confidence_score}.`,
    tie_break_rationale: ranking.tie_break_result,
    state_rationale: `Priority state resolved to ${score.priority_state}.`,
    ranking_rationale: ranking.ranking_order === null ? `${score.priority_state} is not in active ranking.` : `Ranking order ${ranking.ranking_order}.`,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function replayHashValue(input: { scores: readonly CompositePriorityScore[]; rankings: readonly PriorityRankingRecord[]; explanations: readonly PriorityScoringExplanation[]; ledger: PriorityScoringLedgerRecord }): string {
  return hash(input);
}

function buildReplay(replayHash: string, rankingOrder: readonly string[], failures: readonly PriorityScoringFailureReason[]): PriorityScoringReplayRecord {
  const base: Omit<PriorityScoringReplayRecord, "integrity_hash"> = {
    replay_id: "priority_scoring_replay",
    expected_hash: replayHash,
    reconstructed_hash: replayHash,
    replay_valid: failures.length === 0,
    ranking_order: rankingOrder,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildLedger(candidates: readonly DecisionCandidate[], scores: readonly CompositePriorityScore[], rankings: readonly PriorityRankingRecord[]): PriorityScoringLedgerRecord {
  const active = rankings.filter((ranking) => ranking.ranking_order !== null).sort((a, b) => (a.ranking_order ?? 0) - (b.ranking_order ?? 0));
  const base: Omit<PriorityScoringLedgerRecord, "integrity_hash"> = {
    ledger_entry_id: `priority_scoring_ledger_${candidates[0]?.tenant_id ?? "tenant_alpha"}_${candidates[0]?.mission_id ?? "mission_alpha"}`,
    tenant_id: candidates[0]?.tenant_id ?? "tenant_alpha",
    mission_id: candidates[0]?.mission_id ?? "mission_alpha",
    ranking_refs: rankings.map((ranking) => ranking.ranking_id).sort(),
    score_refs: scores.map((score) => score.score_id).sort(),
    active_ranking_order: active.map((ranking) => ranking.decision_candidate_id),
    blocked_candidate_refs: rankings.filter((ranking) => ranking.priority_state === "BLOCKED").map((ranking) => ranking.decision_candidate_id).sort(),
    rejected_candidate_refs: rankings.filter((ranking) => ranking.priority_state === "REJECTED").map((ranking) => ranking.decision_candidate_id).sort(),
    governance_refs: normalizeStrings(scores.flatMap((score) => score.governance_refs)),
    replay_refs: normalizeStrings(scores.flatMap((score) => score.replay_refs)),
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function scoreDecisionPriorities(input: PriorityScoringEngineInput = {}): PriorityScoringEngineResult {
  const profile = input.weight_profile ?? createPriorityWeightProfile();
  const candidateInputs = input.candidates?.length ? input.candidates : [{}];
  const entries = candidateInputs.map((candidateInput) => {
    const candidate = candidateFromInput(candidateInput);
    const scores = scoreSet(candidateInput, candidate);
    const evidence_refs = normalizeStrings(candidateInput.evidence_refs ?? candidate.evidence_refs);
    const governance_refs = normalizeStrings(candidateInput.governance_refs ?? candidate.governance_refs);
    const replay_refs = normalizeStrings(candidateInput.replay_refs ?? candidate.replay_refs);
    return { candidate, candidateInput, scores, evidence_refs, governance_refs, replay_refs };
  });
  const failures = collectFailures(input, profile, entries);
  const compositeScores = entries.map((entry) => {
    const filledScores = Object.freeze(Object.fromEntries(FACTORS.map((factor) => [factor, entry.scores[factor] ?? 0])) as Record<DecisionPriorityFactorName, number>);
    return buildScore(entry.candidate, filledScores, profile, constraints(entry.candidateInput, entry.scores), {
      evidence_refs: entry.evidence_refs,
      governance_refs: entry.governance_refs,
      replay_refs: entry.replay_refs,
    });
  });
  const ordered = sortScores(compositeScores);
  const activeRanked = ordered.filter((score) => score.priority_state !== "BLOCKED" && score.priority_state !== "REJECTED");
  const rankings = ordered.map((score) => {
    const entry = entries.find((candidateEntry) => candidateEntry.candidate.candidate_id === score.decision_candidate_id);
    const rankIndex = activeRanked.findIndex((active) => active.decision_candidate_id === score.decision_candidate_id);
    return buildRanking(score, entry?.candidate ?? defaultCandidate(), rankIndex === -1 ? null : rankIndex + 1, profile);
  });
  const explanations = compositeScores.map((score) => buildExplanation(score, rankings.find((ranking) => ranking.decision_candidate_id === score.decision_candidate_id) as PriorityRankingRecord));
  const ledger = buildLedger(entries.map((entry) => entry.candidate), compositeScores, rankings);
  const replayHash = replayHashValue({ scores: compositeScores, rankings, explanations, ledger });
  const replayFailures = input.expected_replay_hash && input.expected_replay_hash !== replayHash ? [...failures, "PRIORITY_SCORING_REPLAY_MISMATCH" as const] : failures;
  const replay = buildReplay(replayHash, ledger.active_ranking_order, Object.freeze([...new Set(replayFailures)]));
  const priorityInputs: DecisionPriority[] = entries.map((entry) => createDecisionPriority({
    candidate: entry.candidate,
    scores: Object.fromEntries(FACTORS.map((factor) => [factor, entry.scores[factor] ?? 0])) as Record<DecisionPriorityFactorName, number>,
    evidence_refs: entry.evidence_refs,
    governance_refs: entry.governance_refs,
    replay_refs: entry.replay_refs,
    forced_state: compositeScores.find((score) => score.decision_candidate_id === entry.candidate.candidate_id)?.priority_state === "BLOCKED" ? "BLOCKED" : compositeScores.find((score) => score.decision_candidate_id === entry.candidate.candidate_id)?.priority_state === "REJECTED" ? "REJECTED" : undefined,
  }));
  const status = replayFailures.length === 0 ? "PASS" : "FAIL";
  const base: Omit<PriorityScoringEngineResult, "integrity_hash"> = {
    scoring_status: status,
    certificationStatus: status,
    failures: Object.freeze([...new Set(replayFailures)]),
    weight_profile: profile,
    composite_scores: Object.freeze(compositeScores),
    ranking_records: Object.freeze(rankings),
    explanations: Object.freeze(explanations),
    ledger_record: ledger,
    replay_record: replay,
    priority_inputs: Object.freeze(priorityInputs),
    deterministic: true,
    advisoryOnly: true,
    failClosed: true,
    replay_hash: replayHash,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function replayPriorityScoring(result: PriorityScoringEngineResult): PriorityScoringReplayRecord {
  const replayHash = replayHashValue({
    scores: result.composite_scores,
    rankings: result.ranking_records,
    explanations: result.explanations,
    ledger: result.ledger_record,
  });
  const failures: PriorityScoringFailureReason[] = replayHash === result.replay_hash ? [] : ["PRIORITY_SCORING_REPLAY_MISMATCH"];
  return buildReplay(replayHash, result.ledger_record.active_ranking_order, Object.freeze(failures));
}

export function buildPriorityScoringObservability(results: readonly PriorityScoringEngineResult[]): PriorityScoringObservability {
  const scores = results.flatMap((result) => result.composite_scores);
  const rankings = results.flatMap((result) => result.ranking_records);
  return Object.freeze({
    evaluations: results.length,
    pass_count: results.filter((result) => result.scoring_status === "PASS").length,
    fail_count: results.filter((result) => result.scoring_status === "FAIL").length,
    ranked_candidates: rankings.filter((ranking) => ranking.ranking_order !== null).length,
    blocked_candidates: rankings.filter((ranking) => ranking.priority_state === "BLOCKED").length,
    rejected_candidates: rankings.filter((ranking) => ranking.priority_state === "REJECTED").length,
    replay_failures: results.filter((result) => !result.replay_record.replay_valid).length,
    weight_profile_failures: results.filter((result) => result.failures.some((failure) => failure.startsWith("WEIGHT") || failure === "GOVERNANCE_OVERRIDES_MISSING")).length,
    tenant_failures: results.filter((result) => result.failures.includes("CROSS_TENANT_REFERENCE_DETECTED")).length,
    average_priority_score: scores.length === 0 ? 0 : scores.reduce((sum, score) => sum + score.overall_priority_score, 0) / scores.length,
    state_distribution: Object.freeze(scores.reduce<Record<DecisionPriorityState, number>>((counts, score) => {
      counts[score.priority_state] = (counts[score.priority_state] ?? 0) + 1;
      return counts;
    }, {} as Record<DecisionPriorityState, number>)),
  });
}

export function getPriorityScoringEngine() {
  const result = scoreDecisionPriorities();
  return Object.freeze({
    engine_version: ENGINE_VERSION,
    result,
    replay: replayPriorityScoring(result),
    observability: buildPriorityScoringObservability([result]),
  });
}
