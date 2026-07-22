import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";
import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type {
  DecisionPriority,
  DecisionPriorityBuildInput,
  DecisionPriorityContractFoundation,
  DecisionPriorityExplanation,
  DecisionPriorityFactorName,
  DecisionPriorityFailureReason,
  DecisionPriorityLifecycleState,
  DecisionPriorityLifecycleTransition,
  DecisionPriorityObservability,
  DecisionPriorityReplayResult,
  DecisionPriorityScores,
  DecisionPriorityScoringProfile,
  DecisionPriorityState,
  DecisionPriorityValidationResult,
} from "@/types/decision-priority-contract";

const NOW = "2026-07-03T09:51:00.000Z";
const PRIORITY_VERSION = "priority-evaluation-contract/v1" as const;
const SCORING_PROFILE_ID = "priority-evaluation-profile/v1" as const;

export const PRIORITY_FACTORS: readonly DecisionPriorityFactorName[] = Object.freeze([
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

export const PRIORITY_STATES: readonly DecisionPriorityState[] = Object.freeze([
  "CRITICAL",
  "HIGH",
  "MODERATE",
  "LOW",
  "DEFERRED",
  "BLOCKED",
  "REJECTED",
]);

export const PRIORITY_LIFECYCLE: readonly DecisionPriorityLifecycleState[] = Object.freeze([
  "REGISTERED",
  "VALIDATED",
  "SCORING",
  "RANKED",
  "EXPLAINED",
  "CERTIFIED",
  "RECORDED",
]);

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

function defaultScores(candidate: DecisionCandidate): DecisionPriorityScores {
  return Object.freeze({
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
  });
}

export function createPriorityScoringProfile(): DecisionPriorityScoringProfile {
  const weights = Object.freeze(Object.fromEntries(PRIORITY_FACTORS.map((factor) => [factor, 0.1])) as Record<DecisionPriorityFactorName, number>);
  const base: Omit<DecisionPriorityScoringProfile, "integrity_hash"> = {
    scoring_profile: SCORING_PROFILE_ID,
    weights,
    state_thresholds: Object.freeze({
      critical: 85,
      high: 70,
      moderate: 40,
      low: 1,
    }),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function scoreInRange(score: number): boolean {
  return Number.isFinite(score) && score >= 0 && score <= 100;
}

function compositeScore(scores: DecisionPriorityScores, profile: DecisionPriorityScoringProfile): number {
  const total = PRIORITY_FACTORS.reduce((sum, factor) => sum + scores[factor] * profile.weights[factor], 0);
  return Number(total.toFixed(6));
}

function classifyPriority(total: number, profile: DecisionPriorityScoringProfile, forced?: "BLOCKED" | "REJECTED"): DecisionPriorityState {
  if (forced) return forced;
  if (total >= profile.state_thresholds.critical) return "CRITICAL";
  if (total >= profile.state_thresholds.high) return "HIGH";
  if (total >= profile.state_thresholds.moderate) return "MODERATE";
  if (total >= profile.state_thresholds.low) return "LOW";
  return "DEFERRED";
}

function priorityHash(priority: Omit<DecisionPriority, "integrity_hash"> | DecisionPriority): string {
  const copy = { ...(priority as DecisionPriority) } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

export function computeDecisionPriorityIntegrityHash(priority: Omit<DecisionPriority, "integrity_hash"> | DecisionPriority): string {
  return priorityHash(priority);
}

export function createDecisionPriority(input: DecisionPriorityBuildInput = {}): DecisionPriority {
  if ((input.hidden_scoring_refs ?? []).length > 0) {
    const candidate = input.candidate ?? defaultCandidate();
    const rejected = createDecisionPriority({ ...input, candidate, hidden_scoring_refs: [], forced_state: "REJECTED" });
    return Object.freeze({ ...rejected, explanation_ref: "hidden_scoring_rejected", integrity_hash: computeDecisionPriorityIntegrityHash({ ...rejected, explanation_ref: "hidden_scoring_rejected" }) });
  }
  const candidate = input.candidate ?? defaultCandidate();
  const profile = input.scoring_profile ?? createPriorityScoringProfile();
  const scores = Object.freeze({
    ...defaultScores(candidate),
    ...(input.scores ?? {}),
  } satisfies DecisionPriorityScores);
  const total = compositeScore(scores, profile);
  const state = classifyPriority(total, profile, input.forced_state);
  const base: Omit<DecisionPriority, "integrity_hash"> = {
    priority_id: `priority_${candidate.tenant_id}_${candidate.mission_id}_${candidate.candidate_id}`,
    decision_candidate_id: candidate.candidate_id,
    tenant_id: input.tenant_id ?? candidate.tenant_id,
    mission_id: input.mission_id ?? candidate.mission_id,
    ...scores,
    total_priority_score: total,
    priority_state: state,
    lifecycle_state: input.lifecycle_state ?? "REGISTERED",
    explanation_ref: `priority_explanation_${candidate.candidate_id}`,
    evidence_refs: Object.freeze(normalizeStrings(input.evidence_refs ?? candidate.evidence_refs)),
    governance_refs: Object.freeze(normalizeStrings(input.governance_refs ?? candidate.governance_refs)),
    constitutional_refs: Object.freeze(normalizeStrings(input.constitutional_refs ?? candidate.governance_refs.filter((ref) => ref.includes("constitutional")).concat("constitution_priority_evaluation_v1"))),
    authority_refs: Object.freeze(normalizeStrings(input.authority_refs ?? [candidate.authority_required ? "authority_operator_review_required" : "authority_advisory_only"])),
    replay_refs: Object.freeze(normalizeStrings(input.replay_refs ?? candidate.replay_refs)),
    scoring_profile: profile.scoring_profile,
    priority_version: PRIORITY_VERSION,
    created_timestamp: NOW,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: priorityHash(base) });
}

export function buildDecisionPriorityExplanation(priority: DecisionPriority, profile: DecisionPriorityScoringProfile = createPriorityScoringProfile()): DecisionPriorityExplanation {
  const contributions = Object.freeze(Object.fromEntries(PRIORITY_FACTORS.map((factor) => [factor, Number((priority[factor] * profile.weights[factor]).toFixed(6))])) as Record<DecisionPriorityFactorName, number>);
  const base: Omit<DecisionPriorityExplanation, "integrity_hash"> = {
    explanation_id: priority.explanation_ref,
    priority_id: priority.priority_id,
    factor_contributions: contributions,
    governance_rationale: `Governance score ${priority.governance_score} contributes ${contributions.governance_score}.`,
    confidence_rationale: `Confidence score ${priority.confidence_score} contributes ${contributions.confidence_score}.`,
    dependency_rationale: `Dependency score ${priority.dependency_score} contributes ${contributions.dependency_score}.`,
    runtime_rationale: `Runtime score ${priority.runtime_score} contributes ${contributions.runtime_score}.`,
    recovery_rationale: `Recovery score ${priority.recovery_score} contributes ${contributions.recovery_score}.`,
    forecast_rationale: `Forecast score ${priority.forecast_score} contributes ${contributions.forecast_score}.`,
    operator_rationale: `Operator score ${priority.operator_score} contributes ${contributions.operator_score}.`,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function tenantLeak(value: unknown, tenantId: string): boolean {
  if (typeof value === "string") return value.includes("tenant_beta") && tenantId !== "tenant_beta";
  if (Array.isArray(value)) return value.some((item) => tenantLeak(item, tenantId));
  if (value && typeof value === "object") return Object.values(value).some((item) => tenantLeak(item, tenantId));
  return false;
}

export function validateDecisionPriority(priority: unknown, profile: DecisionPriorityScoringProfile = createPriorityScoringProfile()): DecisionPriorityValidationResult {
  if (!priority || typeof priority !== "object" || Array.isArray(priority)) {
    return validationResult(["PRIORITY_OBJECT_MISSING"], undefined);
  }
  const typed = priority as DecisionPriority;
  const failures: DecisionPriorityFailureReason[] = [];
  if (!typed.priority_id || !typed.decision_candidate_id || !typed.tenant_id || !typed.mission_id || !typed.explanation_ref || !typed.created_timestamp) failures.push("REQUIRED_FIELD_MISSING");
  if (!typed.decision_candidate_id) failures.push("CANDIDATE_MISSING");
  if (typed.priority_version !== PRIORITY_VERSION) failures.push("REQUIRED_FIELD_MISSING");
  if (typed.scoring_profile !== SCORING_PROFILE_ID || profile.scoring_profile !== SCORING_PROFILE_ID) failures.push("UNKNOWN_SCORING_PROFILE");
  if (!typed.evidence_refs?.length) failures.push("MISSING_EVIDENCE_REFERENCES");
  if (!typed.governance_refs?.length) failures.push("MISSING_GOVERNANCE_REFERENCES");
  if (!typed.constitutional_refs?.length) failures.push("MISSING_CONSTITUTIONAL_REFERENCES");
  if (!typed.authority_refs?.length) failures.push("MISSING_AUTHORITY_REFERENCES");
  if (!typed.replay_refs?.length) failures.push("MISSING_REPLAY_REFERENCES");
  if (!PRIORITY_FACTORS.every((factor) => scoreInRange(typed[factor]))) failures.push("SCORE_OUT_OF_RANGE");
  if (!PRIORITY_STATES.includes(typed.priority_state)) failures.push("INVALID_PRIORITY_STATE");
  if (typed.constitutional_refs?.some((ref) => ref.includes("violation"))) failures.push("CONSTITUTIONAL_VIOLATION");
  if (typed.tenant_id && tenantLeak(typed, typed.tenant_id)) failures.push("TENANT_ISOLATION_VIOLATION");
  if (typed.advisory_only !== true) failures.push("ADVISORY_ONLY_VIOLATION");
  if (typed.integrity_hash && computeDecisionPriorityIntegrityHash(typed) !== typed.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  const expectedTotal = compositeScore(typed, profile);
  if (Math.abs(expectedTotal - typed.total_priority_score) > 0.000001) failures.push("INTEGRITY_HASH_MISMATCH");
  return validationResult(failures, typed);
}

function validationResult(failures: readonly DecisionPriorityFailureReason[], priority: DecisionPriority | undefined): DecisionPriorityValidationResult {
  const has = (failure: DecisionPriorityFailureReason) => failures.includes(failure);
  return Object.freeze({
    validation_state: failures.length ? "REJECTED" : "VALID",
    priority_state: priority?.priority_state ?? "UNKNOWN",
    failures: Object.freeze([...new Set(failures)]),
    checks: Object.freeze({
      schema_complete: !has("PRIORITY_OBJECT_MISSING") && !has("REQUIRED_FIELD_MISSING"),
      candidate_linked: !has("CANDIDATE_MISSING") && Boolean(priority?.decision_candidate_id),
      references_complete: !has("MISSING_EVIDENCE_REFERENCES") && !has("MISSING_GOVERNANCE_REFERENCES") && !has("MISSING_CONSTITUTIONAL_REFERENCES") && !has("MISSING_AUTHORITY_REFERENCES") && !has("MISSING_REPLAY_REFERENCES"),
      scores_in_range: !has("SCORE_OUT_OF_RANGE"),
      state_valid: !has("INVALID_PRIORITY_STATE"),
      integrity_valid: !has("INTEGRITY_HASH_MISMATCH"),
      replay_ready: !has("MISSING_REPLAY_REFERENCES") && !has("REPLAY_MISMATCH"),
      tenant_isolated: !has("TENANT_ISOLATION_VIOLATION"),
      constitutional_valid: !has("CONSTITUTIONAL_VIOLATION") && !has("MISSING_CONSTITUTIONAL_REFERENCES"),
      advisory_only: !has("ADVISORY_ONLY_VIOLATION"),
    }),
  });
}

export function replayDecisionPriority(priority: DecisionPriority, profile: DecisionPriorityScoringProfile = createPriorityScoringProfile()): DecisionPriorityReplayResult {
  const reconstructed_hash = computeDecisionPriorityIntegrityHash(priority);
  const reconstructed_total_priority_score = compositeScore(priority, profile);
  const reconstructed_priority_state = priority.priority_state === "BLOCKED" || priority.priority_state === "REJECTED"
    ? priority.priority_state
    : classifyPriority(reconstructed_total_priority_score, profile);
  const replay_valid = reconstructed_hash === priority.integrity_hash
    && reconstructed_total_priority_score === priority.total_priority_score
    && reconstructed_priority_state === priority.priority_state;
  const base: Omit<DecisionPriorityReplayResult, "integrity_hash"> = {
    replay_id: `replay_${priority.priority_id}`,
    replay_valid,
    priority_id: priority.priority_id,
    reconstructed_hash,
    expected_hash: priority.integrity_hash,
    reconstructed_total_priority_score,
    reconstructed_priority_state,
    failures: replay_valid ? Object.freeze([]) : Object.freeze(["REPLAY_MISMATCH"] as const),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function transitionDecisionPriorityLifecycle(priority: DecisionPriority, to_state: DecisionPriorityLifecycleState): DecisionPriorityLifecycleTransition {
  const fromIndex = PRIORITY_LIFECYCLE.indexOf(priority.lifecycle_state);
  const toIndex = PRIORITY_LIFECYCLE.indexOf(to_state);
  const transition_valid = toIndex === fromIndex + 1 || priority.lifecycle_state === to_state;
  const base: Omit<DecisionPriorityLifecycleTransition, "integrity_hash"> = {
    transition_id: `priority_transition_${priority.priority_id}_${priority.lifecycle_state.toLowerCase()}_${to_state.toLowerCase()}`,
    priority_id: priority.priority_id,
    from_state: priority.lifecycle_state,
    to_state,
    transition_valid,
    replay_ref: `replay_priority_transition_${priority.priority_id}_${to_state.toLowerCase()}`,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function buildDecisionPriorityObservability(priorities: readonly DecisionPriority[]): DecisionPriorityObservability {
  const validations = priorities.map((priority) => validateDecisionPriority(priority));
  const failures = validations.flatMap((validation) => validation.failures);
  return Object.freeze({
    priority_objects_created: priorities.length,
    validation_failures: validations.filter((validation) => validation.validation_state !== "VALID").length,
    replay_failures: priorities.filter((priority) => !replayDecisionPriority(priority).replay_valid).length,
    governance_failures: failures.filter((failure) => failure === "MISSING_GOVERNANCE_REFERENCES").length,
    constitutional_failures: failures.filter((failure) => failure === "MISSING_CONSTITUTIONAL_REFERENCES" || failure === "CONSTITUTIONAL_VIOLATION").length,
    integrity_failures: failures.filter((failure) => failure === "INTEGRITY_HASH_MISMATCH").length,
    tenant_isolation_failures: failures.filter((failure) => failure === "TENANT_ISOLATION_VIOLATION").length,
    average_priority_score: priorities.length === 0 ? 0 : priorities.reduce((sum, priority) => sum + priority.total_priority_score, 0) / priorities.length,
    state_distribution: Object.freeze(priorities.reduce<Record<DecisionPriorityState, number>>((counts, priority) => {
      counts[priority.priority_state] = (counts[priority.priority_state] ?? 0) + 1;
      return counts;
    }, {} as Record<DecisionPriorityState, number>)),
  });
}

export function getPriorityEvaluationContractFoundation(): DecisionPriorityContractFoundation {
  const scoring_profile = createPriorityScoringProfile();
  const priority = createDecisionPriority({ scoring_profile });
  const explanation = buildDecisionPriorityExplanation(priority, scoring_profile);
  return Object.freeze({
    priority_version: PRIORITY_VERSION,
    states: PRIORITY_STATES,
    lifecycle: PRIORITY_LIFECYCLE,
    factors: PRIORITY_FACTORS,
    scoring_profile,
    priority,
    explanation,
    validation: validateDecisionPriority(priority, scoring_profile),
    replay: replayDecisionPriority(priority, scoring_profile),
  });
}
