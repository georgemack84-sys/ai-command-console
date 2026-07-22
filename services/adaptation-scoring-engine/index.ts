import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { generateAdaptationProposals, replayAdaptationProposalGeneration } from "@/services/adaptation-proposal-generator";
import { replayAdaptationProposalContract } from "@/services/adaptation-proposal-contract";
import type { AdaptationProposalGeneratorScenario, GeneratedAdaptationProposal } from "@/types/adaptation-proposal-generator";
import type {
  AdaptationScoreDimension,
  AdaptationScoringApiSurface,
  AdaptationScoringFailure,
  AdaptationScoringFoundation,
  AdaptationScoringInput,
  AdaptationScoringMetrics,
  AdaptationScoringResult,
  AdaptationScoringScenario,
  AdaptationScoringState,
  ProposalDimensionScore,
  ProposalScore,
  ScoreExplanation,
} from "@/types/adaptation-scoring-engine";

const ENGINE_VERSION = "adaptation-scoring-engine/v1" as const;
const CALCULATION_VERSION = "adaptation-scoring-rules/v1" as const;

const DIMENSIONS: readonly AdaptationScoreDimension[] = Object.freeze([
  "BENEFIT",
  "RISK",
  "CONFIDENCE",
  "EVIDENCE",
  "OPERATOR",
  "GOVERNANCE",
  "REPLAY",
  "CERTIFICATION_COMPLEXITY",
  "ROLLBACK_READINESS",
  "EXPLAINABILITY",
]);

type Scenario = NonNullable<AdaptationScoringInput["scenario"]>;

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

function buildApiSurface(): AdaptationScoringApiSurface {
  const base: Omit<AdaptationScoringApiSurface, "integrity_hash"> = {
    api_id: "adaptation_scoring_engine_api",
    score_proposals: "POST /adaptation-scoring-engine/score",
    retrieve_scores: "POST /adaptation-scoring-engine/scores",
    retrieve_dimensions: "POST /adaptation-scoring-engine/dimensions",
    retrieve_explanations: "POST /adaptation-scoring-engine/explanations",
    retrieve_metrics: "POST /adaptation-scoring-engine/metrics",
    replay_scoring: "POST /adaptation-scoring-engine/replay",
    inspect_scoring: "POST /adaptation-scoring-engine/inspect",
    retrieve_contract: "GET /adaptation-scoring-engine/contract",
    approval_supported: false,
    rejection_supported: false,
    implementation_supported: false,
    suppression_supported: false,
    prioritization_supported: false,
    proposal_mutation_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function generatorScenarioFor(scenario: Scenario): AdaptationProposalGeneratorScenario {
  const map: Partial<Record<AdaptationScoringScenario, AdaptationProposalGeneratorScenario>> = {
    HIGH_BENEFIT: "STRATEGIC_IMPROVEMENT",
    HIGH_RISK: "RISK_IMPROVEMENT",
    LOW_EVIDENCE: "EVIDENCE_IMPROVEMENT",
    LOW_EXPLAINABILITY: "OPERATOR_VISIBILITY",
    MISSING_EVIDENCE: "MISSING_EVIDENCE",
    MISSING_REPLAY: "MISSING_REPLAY",
    GOVERNANCE_ABSENT: "GOVERNANCE_FAILURE",
    CONSTITUTIONAL_ABSENT: "CONSTITUTIONAL_FAILURE",
    AUTHORITY_ABSENT: "AUTHORITY_FAILURE",
    CONTRACT_INVALID: "CONTRACT_VALIDATION_FAILURE",
    INTEGRITY_FAILURE: "INTEGRITY_FAILURE",
    TENANT_VIOLATION: "TENANT_VIOLATION",
    PROPOSAL_MUTATION_ATTEMPT: "CONTRACT_VALIDATION_FAILURE",
    SUPPRESSION_ATTEMPT: "BASELINE",
    PRIORITIZATION_ATTEMPT: "BASELINE",
    APPROVAL_ATTEMPT: "BASELINE",
    IMPLEMENTATION_ATTEMPT: "PRODUCTION_MUTATION_ATTEMPT",
  };
  return map[scenario] ?? "BASELINE";
}

function directFailureFor(scenario: Scenario): AdaptationScoringFailure | undefined {
  const map: Partial<Record<AdaptationScoringScenario, AdaptationScoringFailure>> = {
    MISSING_EVIDENCE: "EVIDENCE_INCOMPLETE",
    MISSING_REPLAY: "REPLAY_REFERENCES_MISSING",
    GOVERNANCE_ABSENT: "GOVERNANCE_ANALYSIS_ABSENT",
    CONSTITUTIONAL_ABSENT: "CONSTITUTIONAL_ANALYSIS_ABSENT",
    AUTHORITY_ABSENT: "AUTHORITY_ANALYSIS_ABSENT",
    CONTRACT_INVALID: "PROPOSAL_CONTRACT_INVALID",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    TENANT_VIOLATION: "TENANT_ISOLATION_VIOLATED",
    NONDETERMINISTIC_SCORE: "NONDETERMINISTIC_SCORE_DETECTED",
    PROPOSAL_MUTATION_ATTEMPT: "PROPOSAL_CONTENT_MUTATION_ATTEMPT",
    SUPPRESSION_ATTEMPT: "PROPOSAL_SUPPRESSION_ATTEMPT",
    PRIORITIZATION_ATTEMPT: "PROPOSAL_PRIORITIZATION_ATTEMPT",
    APPROVAL_ATTEMPT: "PROPOSAL_APPROVAL_ATTEMPT",
    IMPLEMENTATION_ATTEMPT: "PROPOSAL_IMPLEMENTATION_ATTEMPT",
  };
  return map[scenario];
}

function scoreFor(proposal: GeneratedAdaptationProposal, dimension: AdaptationScoreDimension, scenario: Scenario): number {
  const contract = proposal.contract_result;
  const p = contract.proposal;
  const evidenceCount = p.supporting_evidence_refs.length;
  const replayCount = p.replay_refs.length;
  const analysisCompleteness = [
    p.expected_benefit.impacts.length,
    p.expected_risk.impacts.length,
    p.governance_impact.impacts.length,
    p.constitutional_impact.impacts.length,
    p.authority_impact.impacts.length,
    p.operator_impact.impacts.length,
  ].filter((count) => count > 0).length;
  const categoryBonus = proposal.categories.length * 3;
  const base: Record<AdaptationScoreDimension, number> = {
    BENEFIT: 62 + p.expected_benefit.impacts.length * 6 + categoryBonus,
    RISK: p.risk_score * 100,
    CONFIDENCE: p.confidence_score * 100,
    EVIDENCE: evidenceCount * 12 + p.supporting_feedback_refs.length * 8 + p.supporting_outcome_refs.length * 8,
    OPERATOR: 58 + p.operator_impact.impacts.length * 8 - (p.approval_requirements.executive_governance_required ? 8 : 0),
    GOVERNANCE: 35 + p.governance_impact.impacts.length * 8 + (p.approval_requirements.executive_governance_required ? 16 : 0),
    REPLAY: replayCount * 10 + p.lineage_refs.length * 10,
    CERTIFICATION_COMPLEXITY: 32 + (p.certification_required ? 16 : 0) + (p.simulation_required ? 14 : 0) + (p.approval_requirements.executive_governance_required ? 18 : 0),
    ROLLBACK_READINESS: p.rollback_plan.rollback_evidence_refs.length * 12 + p.rollback_plan.rollback_replay_refs.length * 10 + (p.rollback_plan.required ? 30 : 0),
    EXPLAINABILITY: 46 + analysisCompleteness * 7 + (p.reason_for_change ? 12 : 0),
  };
  const scenarioAdjustment: Partial<Record<AdaptationScoreDimension, number>> = {
    BENEFIT: scenario === "HIGH_BENEFIT" ? 12 : 0,
    RISK: scenario === "HIGH_RISK" ? 14 : 0,
    EVIDENCE: scenario === "LOW_EVIDENCE" ? -24 : 0,
    EXPLAINABILITY: scenario === "LOW_EXPLAINABILITY" ? -20 : 0,
  };
  const nondeterministicPenalty = scenario === "NONDETERMINISTIC_SCORE" && dimension === "BENEFIT" ? -17 : 0;
  return clampScore(base[dimension] + (scenarioAdjustment[dimension] ?? 0) + nondeterministicPenalty);
}

function explanationFor(proposal: GeneratedAdaptationProposal, dimension: AdaptationScoreDimension | "OVERALL", score: number): ScoreExplanation {
  const p = proposal.contract_result.proposal;
  const base: Omit<ScoreExplanation, "integrity_hash"> = {
    explanation_id: `adaptation_score_explanation_${dimension.toLowerCase()}_${hash(`${proposal.generated_proposal_id}:${dimension}:${score}`).slice(0, 12)}`,
    dimension,
    contributing_factors: freezeArray([
      `score=${score}`,
      `categories=${proposal.categories.join(",")}`,
      `evidence_refs=${p.supporting_evidence_refs.length}`,
      `replay_refs=${p.replay_refs.length}`,
      `governance_required=${p.approval_requirements.governance_approval_required}`,
    ]),
    evidence_references: p.supporting_evidence_refs,
    calculation_version: CALCULATION_VERSION,
    reasoning_summary: `${dimension.toLowerCase()} score calculated from validated proposal metadata and supporting evidence.`,
    confidence_rationale: `Proposal confidence input ${(p.confidence_score * 100).toFixed(2)} with deterministic scoring rules.`,
    replay_references: p.replay_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function dimensionScore(proposal: GeneratedAdaptationProposal, dimension: AdaptationScoreDimension, scenario: Scenario): ProposalDimensionScore {
  const score = scoreFor(proposal, dimension, scenario);
  const base: Omit<ProposalDimensionScore, "integrity_hash"> = {
    dimension,
    score,
    normalized_score: Number((score / 100).toFixed(4)),
    explanation: explanationFor(proposal, dimension, score),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function overallScore(dimensions: readonly ProposalDimensionScore[]): number {
  const value = dimensions.reduce((sum, item) => {
    if (item.dimension === "RISK" || item.dimension === "GOVERNANCE" || item.dimension === "CERTIFICATION_COMPLEXITY") return sum + (100 - item.score) * 0.08;
    if (item.dimension === "BENEFIT") return sum + item.score * 0.18;
    if (item.dimension === "EVIDENCE") return sum + item.score * 0.14;
    if (item.dimension === "REPLAY") return sum + item.score * 0.12;
    if (item.dimension === "ROLLBACK_READINESS") return sum + item.score * 0.1;
    return sum + item.score * 0.1;
  }, 0);
  return clampScore(value);
}

function proposalScore(proposal: GeneratedAdaptationProposal, scenario: Scenario): ProposalScore {
  const dimensions = freezeArray(DIMENSIONS.map((dimension) => dimensionScore(proposal, dimension, scenario)));
  const get = (dimension: AdaptationScoreDimension) => dimensions.find((item) => item.dimension === dimension)?.score ?? 0;
  const overall = overallScore(dimensions);
  const p = proposal.contract_result.proposal;
  const base: Omit<ProposalScore, "integrity_hash"> = {
    score_id: `proposal_score_${hash(`${proposal.generated_proposal_id}:${overall}`).slice(0, 14)}`,
    proposal_id: p.proposal_id,
    generated_proposal_id: proposal.generated_proposal_id,
    overall_score: overall,
    benefit_score: get("BENEFIT"),
    risk_score: get("RISK"),
    confidence_score: get("CONFIDENCE"),
    governance_score: get("GOVERNANCE"),
    operator_score: get("OPERATOR"),
    evidence_score: get("EVIDENCE"),
    replay_score: get("REPLAY"),
    certification_complexity_score: get("CERTIFICATION_COMPLEXITY"),
    rollback_readiness_score: get("ROLLBACK_READINESS"),
    explainability_score: get("EXPLAINABILITY"),
    simulation_score: get("REPLAY"),
    dimension_scores: dimensions,
    overall_explanation: explanationFor(proposal, "OVERALL", overall),
    scoring_version: ENGINE_VERSION,
    calculation_version: CALCULATION_VERSION,
    proposal_integrity_hash: p.integrity_hash,
    replay_refs: p.replay_refs,
    evidence_refs: p.supporting_evidence_refs,
    advisory_only: true,
    approves_proposal: false,
    rejects_proposal: false,
    implements_proposal: false,
    suppresses_proposal: false,
    prioritizes_proposal: false,
    mutates_proposal: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(proposals: readonly GeneratedAdaptationProposal[], scores: readonly ProposalScore[], scenario: Scenario, generatorReplayable: boolean): readonly AdaptationScoringFailure[] {
  const failures: AdaptationScoringFailure[] = [];
  const direct = directFailureFor(scenario);
  if (direct) failures.push(direct);
  if (proposals.some((proposal) => !proposal.contract_result.validation_report.certified)) failures.push("PROPOSAL_CONTRACT_INVALID");
  if (proposals.some((proposal) => proposal.contract_result.proposal.supporting_evidence_refs.length === 0)) failures.push("EVIDENCE_INCOMPLETE");
  if (proposals.some((proposal) => proposal.contract_result.proposal.replay_refs.length === 0)) failures.push("REPLAY_REFERENCES_MISSING");
  if (proposals.some((proposal) => !proposal.contract_result.validation_report.governance_complete)) failures.push("GOVERNANCE_ANALYSIS_ABSENT");
  if (proposals.some((proposal) => !proposal.contract_result.validation_report.constitutional_complete)) failures.push("CONSTITUTIONAL_ANALYSIS_ABSENT");
  if (proposals.some((proposal) => !proposal.contract_result.validation_report.authority_complete)) failures.push("AUTHORITY_ANALYSIS_ABSENT");
  if (!generatorReplayable || proposals.some((proposal) => !replayAdaptationProposalContract(proposal.contract_result)) || scores.some((score) => score.integrity_hash !== hashWithoutIntegrity(score))) failures.push("INTEGRITY_VERIFICATION_FAILED");
  if (new Set(proposals.map((proposal) => proposal.contract_result.proposal.tenant_id)).size > 1 || proposals.some((proposal) => !proposal.contract_result.tenant_isolated)) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "NONDETERMINISTIC_SCORE") failures.push("SCORE_REPLAY_NOT_REPRODUCIBLE");
  return freezeArray([...new Set(failures)]);
}

function stateFor(failures: readonly AdaptationScoringFailure[]): AdaptationScoringState {
  if (failures.includes("EVIDENCE_INCOMPLETE") || failures.includes("REPLAY_REFERENCES_MISSING")) return "PENDING_EVIDENCE";
  return failures.length ? "FAILED" : "SCORED";
}

function average(values: readonly number[]): number {
  return values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)) : 0;
}

function buildMetrics(scores: readonly ProposalScore[], failures: readonly AdaptationScoringFailure[]): AdaptationScoringMetrics {
  const base: Omit<AdaptationScoringMetrics, "integrity_hash"> = {
    proposals_scored: scores.length,
    average_overall_score: average(scores.map((score) => score.overall_score)),
    average_benefit_score: average(scores.map((score) => score.benefit_score)),
    average_risk_score: average(scores.map((score) => score.risk_score)),
    evidence_quality_distribution: freezeArray(scores.map((score) => score.evidence_score)),
    governance_sensitivity_distribution: freezeArray(scores.map((score) => score.governance_score)),
    operator_usefulness_distribution: freezeArray(scores.map((score) => score.operator_score)),
    explainability_distribution: freezeArray(scores.map((score) => score.explainability_score)),
    replay_completeness_rate: scores.length ? average(scores.map((score) => score.replay_score)) / 100 : 0,
    scoring_latency_ms: 0,
    validation_failures: failures,
    deterministic_replay_success_rate: failures.length ? 0 : 1,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<AdaptationScoringResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    generator_hash: result.generator_result.integrity_hash,
    score_hashes: result.scored_proposals.map((score) => score.integrity_hash),
    metrics_hash: result.metrics.integrity_hash,
    state: result.scoring_state,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<AdaptationScoringResult, "integrity_hash">): string {
  return hash({
    version: result.adaptation_scoring_engine_version,
    calculation_version: result.calculation_version,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    metrics_hash: result.metrics.integrity_hash,
  });
}

export function scoreAdaptationProposals(input: AdaptationScoringInput = {}): AdaptationScoringResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const generator_result = input.generator_result ?? generateAdaptationProposals({ scenario: generatorScenarioFor(scenario) });
  const scored_proposals = freezeArray(generator_result.generated_proposals.map((proposal) => proposalScore(proposal, scenario)));
  const failures = collectFailures(generator_result.generated_proposals, scored_proposals, scenario, replayAdaptationProposalGeneration(generator_result));
  const metrics = buildMetrics(scored_proposals, failures);
  const base: Omit<AdaptationScoringResult, "integrity_hash" | "replay_hash"> = {
    adaptation_scoring_engine_version: ENGINE_VERSION,
    calculation_version: CALCULATION_VERSION,
    api_surface,
    generator_result,
    scored_proposals,
    metrics,
    scoring_state: stateFor(failures),
    failures,
    deterministic: true,
    replayable: failures.length === 0 && replayAdaptationProposalGeneration(generator_result),
    explainable: scored_proposals.every((score) => Boolean(score.overall_explanation.reasoning_summary)),
    evidence_based: scored_proposals.every((score) => score.evidence_refs.length > 0),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    governance_neutral: true,
    advisory_only: true,
    approves_proposals: false,
    rejects_proposals: false,
    implements_proposals: false,
    suppresses_proposals: false,
    prioritizes_proposals: false,
    mutates_proposals: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayAdaptationScoring(result: AdaptationScoringResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getAdaptationScoringFoundation(): AdaptationScoringFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    adaptation_scoring_engine_version: ENGINE_VERSION,
    supported_dimensions: DIMENSIONS,
    api_surface,
    result: scoreAdaptationProposals(),
  });
}

export const AdaptationScoringEngine = Object.freeze({
  score: scoreAdaptationProposals,
  replay: replayAdaptationScoring,
});
