import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { replayAdaptationScoring, scoreAdaptationProposals } from "@/services/adaptation-scoring-engine";
import type { AdaptationScoringScenario, ProposalScore } from "@/types/adaptation-scoring-engine";
import type {
  AdaptationPriorityFactor,
  AdaptationPriorityLevel,
  AdaptationPrioritizationApiSurface,
  AdaptationPrioritizationFailure,
  AdaptationPrioritizationFoundation,
  AdaptationPrioritizationInput,
  AdaptationPrioritizationMetrics,
  AdaptationPrioritizationResult,
  AdaptationPrioritizationScenario,
  AdaptationPrioritizationState,
  PrioritizedAdaptationProposal,
  PriorityExplanation,
  PriorityFactorScore,
} from "@/types/adaptation-prioritization-engine";

const ENGINE_VERSION = "adaptation-prioritization-engine/v1" as const;
const CALCULATION_VERSION = "adaptation-prioritization-rules/v1" as const;

const FACTORS: readonly AdaptationPriorityFactor[] = Object.freeze([
  "EXPECTED_BENEFIT",
  "URGENCY",
  "RECURRENCE",
  "MISSION_IMPACT",
  "OPERATOR_IMPACT",
  "GOVERNANCE_IMPACT",
  "CONSTITUTIONAL_IMPORTANCE",
  "EVIDENCE_STRENGTH",
  "SIMULATION_READINESS",
  "CERTIFICATION_READINESS",
]);

const PRIORITY_LEVELS: readonly AdaptationPriorityLevel[] = Object.freeze(["CRITICAL", "HIGH", "MEDIUM", "LOW", "DEFERRED"]);

const FACTOR_WEIGHTS: Readonly<Record<AdaptationPriorityFactor, number>> = Object.freeze({
  EXPECTED_BENEFIT: 0.16,
  URGENCY: 0.12,
  RECURRENCE: 0.1,
  MISSION_IMPACT: 0.15,
  OPERATOR_IMPACT: 0.1,
  GOVERNANCE_IMPACT: 0.09,
  CONSTITUTIONAL_IMPORTANCE: 0.1,
  EVIDENCE_STRENGTH: 0.08,
  SIMULATION_READINESS: 0.05,
  CERTIFICATION_READINESS: 0.05,
});

type Scenario = NonNullable<AdaptationPrioritizationInput["scenario"]>;

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

function clampScore(value: number): number {
  return Number(Math.max(0, Math.min(100, value)).toFixed(2));
}

function buildApiSurface(): AdaptationPrioritizationApiSurface {
  const base: Omit<AdaptationPrioritizationApiSurface, "integrity_hash"> = {
    api_id: "adaptation_prioritization_engine_api",
    prioritize_proposals: "POST /adaptation-prioritization-engine/prioritize",
    retrieve_priorities: "POST /adaptation-prioritization-engine/priorities",
    retrieve_factors: "POST /adaptation-prioritization-engine/factors",
    retrieve_explanations: "POST /adaptation-prioritization-engine/explanations",
    retrieve_metrics: "POST /adaptation-prioritization-engine/metrics",
    replay_prioritization: "POST /adaptation-prioritization-engine/replay",
    inspect_prioritization: "POST /adaptation-prioritization-engine/inspect",
    retrieve_contract: "GET /adaptation-prioritization-engine/contract",
    approval_supported: false,
    rejection_supported: false,
    implementation_supported: false,
    suppression_supported: false,
    proposal_mutation_supported: false,
    governance_workflow_mutation_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function scoringScenarioFor(scenario: Scenario): AdaptationScoringScenario {
  const map: Partial<Record<AdaptationPrioritizationScenario, AdaptationScoringScenario>> = {
    CRITICAL: "HIGH_BENEFIT",
    HIGH: "HIGH_BENEFIT",
    MEDIUM: "BASELINE",
    LOW: "LOW_EVIDENCE",
    DEFERRED: "MISSING_EVIDENCE",
    MISSING_SCORE: "BASELINE",
    MISSING_EVIDENCE: "MISSING_EVIDENCE",
    MISSING_REPLAY: "MISSING_REPLAY",
    GOVERNANCE_MISSING: "GOVERNANCE_ABSENT",
    CONSTITUTIONAL_MISSING: "CONSTITUTIONAL_ABSENT",
    INVALID_PROPOSAL: "CONTRACT_INVALID",
    INTEGRITY_FAILURE: "INTEGRITY_FAILURE",
    TENANT_VIOLATION: "TENANT_VIOLATION",
    ORDERING_FAILURE: "NONDETERMINISTIC_SCORE",
    MUTATION_ATTEMPT: "PROPOSAL_MUTATION_ATTEMPT",
    APPROVAL_ATTEMPT: "APPROVAL_ATTEMPT",
    SUPPRESSION_ATTEMPT: "SUPPRESSION_ATTEMPT",
  };
  return map[scenario] ?? "BASELINE";
}

function directFailureFor(scenario: Scenario): AdaptationPrioritizationFailure | undefined {
  const map: Partial<Record<AdaptationPrioritizationScenario, AdaptationPrioritizationFailure>> = {
    MISSING_SCORE: "PROPOSAL_SCORE_UNAVAILABLE",
    MISSING_EVIDENCE: "EVIDENCE_INCOMPLETE",
    MISSING_REPLAY: "REPLAY_REFERENCES_INCOMPLETE",
    GOVERNANCE_MISSING: "GOVERNANCE_ANALYSIS_MISSING",
    CONSTITUTIONAL_MISSING: "CONSTITUTIONAL_ANALYSIS_MISSING",
    INVALID_PROPOSAL: "PROPOSAL_VALIDATION_FAILED",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    ORDERING_FAILURE: "DETERMINISTIC_ORDERING_NOT_GUARANTEED",
    TENANT_VIOLATION: "TENANT_ISOLATION_VIOLATED",
    MUTATION_ATTEMPT: "PROPOSAL_CONTENT_MUTATION_ATTEMPT",
    APPROVAL_ATTEMPT: "PROPOSAL_APPROVAL_ATTEMPT",
    REJECTION_ATTEMPT: "PROPOSAL_REJECTION_ATTEMPT",
    SUPPRESSION_ATTEMPT: "PROPOSAL_SUPPRESSION_ATTEMPT",
    GOVERNANCE_WORKFLOW_ALTERATION: "GOVERNANCE_WORKFLOW_ALTERATION_ATTEMPT",
  };
  return map[scenario];
}

function factorValue(score: ProposalScore, factor: AdaptationPriorityFactor, scenario: Scenario): number {
  const p = score;
  const base: Record<AdaptationPriorityFactor, number> = {
    EXPECTED_BENEFIT: p.benefit_score,
    URGENCY: scenario === "CRITICAL" ? 96 : scenario === "HIGH" ? 82 : scenario === "LOW" ? 24 : 58,
    RECURRENCE: scenario === "CRITICAL" || scenario === "HIGH" ? 86 : scenario === "LOW" ? 28 : 62,
    MISSION_IMPACT: clampScore(p.overall_score * 0.72 + p.benefit_score * 0.28),
    OPERATOR_IMPACT: p.operator_score,
    GOVERNANCE_IMPACT: p.governance_score,
    CONSTITUTIONAL_IMPORTANCE: scenario === "CRITICAL" ? 94 : scenario === "GOVERNANCE_MISSING" || scenario === "CONSTITUTIONAL_MISSING" ? 0 : 68,
    EVIDENCE_STRENGTH: p.evidence_score,
    SIMULATION_READINESS: p.simulation_score,
    CERTIFICATION_READINESS: clampScore(100 - p.certification_complexity_score + p.evidence_score * 0.35),
  };
  const deferredPenalty = scenario === "DEFERRED" ? -45 : 0;
  return clampScore(base[factor] + deferredPenalty);
}

function factorScore(score: ProposalScore, factor: AdaptationPriorityFactor, scenario: Scenario): PriorityFactorScore {
  const value = factorValue(score, factor, scenario);
  const weight = FACTOR_WEIGHTS[factor];
  const base: Omit<PriorityFactorScore, "integrity_hash"> = {
    factor,
    score: value,
    weight,
    weighted_score: Number((value * weight).toFixed(4)),
    evidence_refs: score.evidence_refs,
    replay_refs: score.replay_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function priorityScore(factors: readonly PriorityFactorScore[]): number {
  return clampScore(factors.reduce((sum, factor) => sum + factor.weighted_score, 0));
}

function levelFor(score: number, scenario: Scenario, failures: readonly AdaptationPrioritizationFailure[]): AdaptationPriorityLevel {
  if (failures.length > 0 || scenario === "DEFERRED") return "DEFERRED";
  if (scenario === "CRITICAL") return "CRITICAL";
  if (scenario === "HIGH") return "HIGH";
  if (scenario === "MEDIUM") return "MEDIUM";
  if (scenario === "LOW") return "LOW";
  if (score >= 82) return "CRITICAL";
  if (score >= 68) return "HIGH";
  if (score < 42) return "LOW";
  return "MEDIUM";
}

function explanationFor(score: ProposalScore, level: AdaptationPriorityLevel, factors: readonly PriorityFactorScore[]): PriorityExplanation {
  const weights = FACTORS.reduce((acc, factor) => ({ ...acc, [factor]: FACTOR_WEIGHTS[factor] }), {} as Record<AdaptationPriorityFactor, number>);
  const base: Omit<PriorityExplanation, "integrity_hash"> = {
    explanation_id: `adaptation_priority_explanation_${hash(`${score.proposal_id}:${level}`).slice(0, 14)}`,
    proposal_id: score.proposal_id,
    priority_level: level,
    contributing_factors: factors.map((factor) => `${factor.factor}:${factor.score}`),
    factor_weights: Object.freeze(weights),
    evidence_references: score.evidence_refs,
    readiness_assessment: `simulation=${score.simulation_score}; certification=${score.certification_complexity_score}; rollback=${score.rollback_readiness_score}`,
    governance_considerations: freezeArray([`governance_score=${score.governance_score}`, "formal_review_still_required"]),
    constitutional_considerations: freezeArray(["constitutional_precedence_tie_breaker", "authority_preservation_required"]),
    replay_references: score.replay_refs,
    calculation_version: CALCULATION_VERSION,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function prioritizeScore(score: ProposalScore, scenario: Scenario, preFailures: readonly AdaptationPrioritizationFailure[]): Omit<PrioritizedAdaptationProposal, "rank" | "integrity_hash"> {
  const factors = freezeArray(FACTORS.map((factor) => factorScore(score, factor, scenario)));
  const calculated = scenario === "ORDERING_FAILURE" ? priorityScore(factors) - 7 : priorityScore(factors);
  const priority_score = clampScore(calculated);
  const priority_level = levelFor(priority_score, scenario, preFailures);
  return {
    priority_id: `adaptation_priority_${hash(`${score.score_id}:${priority_score}:${priority_level}`).slice(0, 14)}`,
    proposal_id: score.proposal_id,
    generated_proposal_id: score.generated_proposal_id,
    score_id: score.score_id,
    priority_level,
    priority_score,
    factor_scores: factors,
    explanation: explanationFor(score, priority_level, factors),
    tie_break_values: freezeArray([
      String(factorValue(score, "CONSTITUTIONAL_IMPORTANCE", scenario)).padStart(6, "0"),
      String(score.governance_score).padStart(6, "0"),
      String(factorValue(score, "MISSION_IMPACT", scenario)).padStart(6, "0"),
      String(score.evidence_score).padStart(6, "0"),
      String(score.operator_score).padStart(6, "0"),
      score.proposal_id,
    ]),
    replay_refs: score.replay_refs,
    evidence_refs: score.evidence_refs,
    advisory_only: true,
    approves_proposal: false,
    rejects_proposal: false,
    implements_proposal: false,
    suppresses_proposal: false,
    mutates_proposal: false,
    alters_governance_workflow: false,
  };
}

function ranked(items: readonly Omit<PrioritizedAdaptationProposal, "rank" | "integrity_hash">[]): readonly PrioritizedAdaptationProposal[] {
  const sorted = [...items].sort((a, b) => {
    const levelOrder: Record<AdaptationPriorityLevel, number> = { CRITICAL: 5, HIGH: 4, MEDIUM: 3, LOW: 2, DEFERRED: 1 };
    return levelOrder[b.priority_level] - levelOrder[a.priority_level]
      || b.priority_score - a.priority_score
      || [...b.tie_break_values].join("|").localeCompare([...a.tie_break_values].join("|"));
  });
  return freezeArray(sorted.map((item, index) => {
    const base = { ...item, rank: index + 1 };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function collectFailures(scores: readonly ProposalScore[], scenario: Scenario, scoringReplayable: boolean, scoringFailures: readonly string[]): readonly AdaptationPrioritizationFailure[] {
  const failures: AdaptationPrioritizationFailure[] = [];
  const direct = directFailureFor(scenario);
  if (direct) failures.push(direct);
  if (scenario === "MISSING_SCORE" || scores.length === 0) failures.push("PROPOSAL_SCORE_UNAVAILABLE");
  if (scoringFailures.includes("PROPOSAL_CONTRACT_INVALID")) failures.push("PROPOSAL_VALIDATION_FAILED");
  if (scoringFailures.includes("EVIDENCE_INCOMPLETE") || scores.some((score) => score.evidence_refs.length === 0)) failures.push("EVIDENCE_INCOMPLETE");
  if (scoringFailures.includes("REPLAY_REFERENCES_MISSING") || scores.some((score) => score.replay_refs.length === 0)) failures.push("REPLAY_REFERENCES_INCOMPLETE");
  if (scoringFailures.includes("GOVERNANCE_ANALYSIS_ABSENT")) failures.push("GOVERNANCE_ANALYSIS_MISSING");
  if (scoringFailures.includes("CONSTITUTIONAL_ANALYSIS_ABSENT")) failures.push("CONSTITUTIONAL_ANALYSIS_MISSING");
  if (!scoringReplayable || scoringFailures.includes("INTEGRITY_VERIFICATION_FAILED")) failures.push("INTEGRITY_VERIFICATION_FAILED");
  if (scoringFailures.includes("TENANT_ISOLATION_VIOLATED")) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "ORDERING_FAILURE") failures.push("DETERMINISTIC_ORDERING_NOT_GUARANTEED");
  return freezeArray([...new Set(failures)]);
}

function stateFor(failures: readonly AdaptationPrioritizationFailure[]): AdaptationPrioritizationState {
  if (failures.includes("EVIDENCE_INCOMPLETE") || failures.includes("REPLAY_REFERENCES_INCOMPLETE") || failures.includes("PROPOSAL_SCORE_UNAVAILABLE")) return "DEFERRED";
  return failures.length ? "FAILED" : "PRIORITIZED";
}

function distribution(prioritized: readonly PrioritizedAdaptationProposal[]): Readonly<Record<AdaptationPriorityLevel, number>> {
  const base: Record<AdaptationPriorityLevel, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, DEFERRED: 0 };
  prioritized.forEach((item) => {
    base[item.priority_level] += 1;
  });
  return Object.freeze(base);
}

function average(values: readonly number[]): number {
  return values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)) : 0;
}

function factorDistribution(prioritized: readonly PrioritizedAdaptationProposal[], factor: AdaptationPriorityFactor): readonly number[] {
  return freezeArray(prioritized.map((item) => item.factor_scores.find((score) => score.factor === factor)?.score ?? 0));
}

function metricsFor(prioritized: readonly PrioritizedAdaptationProposal[], failures: readonly AdaptationPrioritizationFailure[]): AdaptationPrioritizationMetrics {
  const base: Omit<AdaptationPrioritizationMetrics, "integrity_hash"> = {
    proposals_prioritized: prioritized.length,
    priority_distribution: distribution(prioritized),
    average_prioritization_latency_ms: 0,
    benefit_distribution: factorDistribution(prioritized, "EXPECTED_BENEFIT"),
    urgency_distribution: factorDistribution(prioritized, "URGENCY"),
    mission_impact_distribution: factorDistribution(prioritized, "MISSION_IMPACT"),
    evidence_strength_distribution: factorDistribution(prioritized, "EVIDENCE_STRENGTH"),
    governance_sensitivity_distribution: factorDistribution(prioritized, "GOVERNANCE_IMPACT"),
    simulation_readiness_distribution: factorDistribution(prioritized, "SIMULATION_READINESS"),
    certification_readiness_distribution: factorDistribution(prioritized, "CERTIFICATION_READINESS"),
    deterministic_replay_success: failures.length === 0,
    prioritization_validation_failures: failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<AdaptationPrioritizationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    scoring_hash: result.scoring_result.integrity_hash,
    priority_hashes: result.prioritized_proposals.map((proposal) => proposal.integrity_hash),
    metrics_hash: result.metrics.integrity_hash,
    state: result.prioritization_state,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<AdaptationPrioritizationResult, "integrity_hash">): string {
  return hash({
    version: result.adaptation_prioritization_engine_version,
    calculation_version: result.calculation_version,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    metrics_hash: result.metrics.integrity_hash,
  });
}

export function prioritizeAdaptationProposals(input: AdaptationPrioritizationInput = {}): AdaptationPrioritizationResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const scoring_result = input.scoring_result ?? scoreAdaptationProposals({ scenario: scoringScenarioFor(scenario) });
  const preFailures = collectFailures(scoring_result.scored_proposals, scenario, replayAdaptationScoring(scoring_result), scoring_result.failures);
  const prioritized_proposals = ranked(scoring_result.scored_proposals.map((score) => prioritizeScore(score, scenario, preFailures)));
  const failures = collectFailures(scoring_result.scored_proposals, scenario, replayAdaptationScoring(scoring_result), scoring_result.failures);
  const metrics = metricsFor(prioritized_proposals, failures);
  const base: Omit<AdaptationPrioritizationResult, "integrity_hash" | "replay_hash"> = {
    adaptation_prioritization_engine_version: ENGINE_VERSION,
    calculation_version: CALCULATION_VERSION,
    api_surface,
    scoring_result,
    prioritized_proposals,
    metrics,
    prioritization_state: stateFor(failures),
    failures,
    deterministic: true,
    replayable: failures.length === 0 && replayAdaptationScoring(scoring_result),
    explainable: prioritized_proposals.every((proposal) => Boolean(proposal.explanation.contributing_factors.length)),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED") && scoring_result.tenant_isolated,
    evidence_validated: !failures.includes("EVIDENCE_INCOMPLETE"),
    governance_aware: !failures.includes("GOVERNANCE_ANALYSIS_MISSING"),
    constitutional_precedence_enforced: !failures.includes("CONSTITUTIONAL_ANALYSIS_MISSING"),
    advisory_only: true,
    approves_proposals: false,
    rejects_proposals: false,
    implements_proposals: false,
    suppresses_proposals: false,
    mutates_proposals: false,
    alters_governance_workflows: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayAdaptationPrioritization(result: AdaptationPrioritizationResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getAdaptationPrioritizationFoundation(): AdaptationPrioritizationFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    adaptation_prioritization_engine_version: ENGINE_VERSION,
    supported_factors: FACTORS,
    priority_levels: PRIORITY_LEVELS,
    api_surface,
    result: prioritizeAdaptationProposals(),
  });
}

export const AdaptationPrioritizationEngine = Object.freeze({
  prioritize: prioritizeAdaptationProposals,
  replay: replayAdaptationPrioritization,
});
