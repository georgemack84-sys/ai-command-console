import { compareExpectedVsActual, replayExpectedVsActual } from "@/services/expected-vs-actual-comparator";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type { ComparatorInput, ComparatorResult } from "@/types/expected-vs-actual-comparator";
import type {
  RecommendationDimensionScore,
  RecommendationQualityApiSurface,
  RecommendationQualityDimension,
  RecommendationQualityFailure,
  RecommendationQualityFoundation,
  RecommendationQualityInput,
  RecommendationQualityLedgerRecord,
  RecommendationQualityRating,
  RecommendationQualityResult,
  RecommendationQualityScenario,
  RecommendationQualityScore,
  RecommendationQualityValidation,
  WeightingProfile,
} from "@/types/recommendation-quality-scoring";

const QUALITY_SCORING_VERSION = "recommendation-quality-scoring/v1" as const;

export const RECOMMENDATION_QUALITY_DIMENSIONS: readonly RecommendationQualityDimension[] = Object.freeze([
  "USEFULNESS",
  "COMPLETENESS",
  "CORRECTNESS",
  "EXPLAINABILITY",
  "EVIDENCE_QUALITY",
  "CONFIDENCE_QUALITY",
  "GOVERNANCE_COMPLIANCE",
  "AUTHORITY_CORRECTNESS",
  "ALTERNATIVE_USEFULNESS",
  "ROLLBACK_USEFULNESS",
  "OPERATOR_USABILITY",
]);

const APPROVED_WEIGHTS: Readonly<Record<RecommendationQualityDimension, number>> = Object.freeze({
  USEFULNESS: 0.13,
  COMPLETENESS: 0.09,
  CORRECTNESS: 0.15,
  EXPLAINABILITY: 0.09,
  EVIDENCE_QUALITY: 0.11,
  CONFIDENCE_QUALITY: 0.08,
  GOVERNANCE_COMPLIANCE: 0.12,
  AUTHORITY_CORRECTNESS: 0.08,
  ALTERNATIVE_USEFULNESS: 0.05,
  ROLLBACK_USEFULNESS: 0.04,
  OPERATOR_USABILITY: 0.06,
});

type Scenario = NonNullable<RecommendationQualityInput["scenario"]>;

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

function sourceForScenario(input: RecommendationQualityInput, scenario: Scenario): ComparatorResult {
  if (input.comparator) return input.comparator;
  const comparatorScenario: ComparatorInput["scenario"] =
    scenario === "INCOMPLETE_EVIDENCE" ? "INCOMPLETE_EVIDENCE" :
    scenario === "MISSING_GOVERNANCE" ? "MISSING_GOVERNANCE" :
    scenario === "MISSING_REPLAY" ? "MISSING_REPLAY" :
    scenario === "INCOMPLETE_LINEAGE" ? "INCOMPLETE_LINEAGE" :
    scenario === "HASH_MISMATCH" ? "HASH_MISMATCH" :
    scenario === "CROSS_TENANT" ? "CROSS_TENANT" :
    scenario === "RECONSTRUCTION_FAILURE" ? "RECONSTRUCTION_FAILURE" :
    scenario === "GOVERNANCE_FAILURE" ? "GOVERNANCE_FAILURE" :
    scenario === "CONSTITUTIONAL_FAILURE" ? "CONSTITUTIONAL_FAILURE" :
    scenario === "REPLAY_DIVERGENCE" ? "REPLAY_DIVERGENCE" :
    scenario === "LEDGER_MUTATION" ? "LEDGER_MUTATION" :
    scenario === "EXCEPTIONAL" ? "BASELINE" :
    scenario === "HIGH" ? "MINOR_VARIANCE" :
    scenario === "GOOD" ? "MODERATE_VARIANCE" :
    scenario === "ACCEPTABLE" ? "MAJOR_VARIANCE" :
    scenario === "MARGINAL" || scenario === "POOR" || scenario === "UNACCEPTABLE" ? "CRITICAL_VARIANCE" :
    "BASELINE";
  return compareExpectedVsActual({ scenario: comparatorScenario });
}

function buildApiSurface(): RecommendationQualityApiSurface {
  const base: Omit<RecommendationQualityApiSurface, "integrity_hash"> = {
    api_id: "recommendation_quality_scoring_api",
    score_recommendation: "POST /recommendation-quality-scoring/score",
    validate_scoring: "POST /recommendation-quality-scoring/validate",
    replay_scoring: "POST /recommendation-quality-scoring/replay",
    calculate_performance: "POST /recommendation-quality-scoring/performance",
    retrieve_contract: "GET /recommendation-quality-scoring/contract",
    update_supported: false,
    delete_supported: false,
    adaptive_learning_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildWeightingProfile(scenario: Scenario = "BASELINE"): WeightingProfile {
  const weights = scenario === "INVALID_WEIGHTING" ? Object.freeze({ ...APPROVED_WEIGHTS, USEFULNESS: 0.25 }) : APPROVED_WEIGHTS;
  const base: Omit<WeightingProfile, "integrity_hash"> = {
    profile_id: "governance_approved_quality_profile",
    profile_version: "10.3.3",
    governance_approved: scenario !== "INVALID_WEIGHTING",
    immutable: true,
    weights,
    weight_total: Number(Object.values(weights).reduce((sum, weight) => sum + weight, 0).toFixed(4)),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function ratingTarget(scenario: Scenario): number | undefined {
  const targets: Partial<Record<RecommendationQualityScenario, number>> = {
    EXCEPTIONAL: 0.96,
    HIGH: 0.88,
    GOOD: 0.78,
    ACCEPTABLE: 0.68,
    MARGINAL: 0.56,
    POOR: 0.42,
    UNACCEPTABLE: 0.22,
  };
  return targets[scenario];
}

function comparatorQualityBase(comparator: ComparatorResult): number {
  const penalty = comparator.variances.reduce((sum, variance) => {
    const severityPenalty = variance.severity === "NONE" ? 0 : variance.severity === "LOW" ? 0.03 : variance.severity === "MODERATE" ? 0.11 : variance.severity === "HIGH" ? 0.24 : 0.42;
    return sum + severityPenalty;
  }, 0) / comparator.variances.length;
  return Number(Math.max(0, Math.min(1, 0.94 - penalty)).toFixed(4));
}

function rawScoreForDimension(dimension: RecommendationQualityDimension, comparator: ComparatorResult, scenario: Scenario): number {
  const target = ratingTarget(scenario);
  if (target !== undefined) return target;
  const base = comparatorQualityBase(comparator);
  const evidencePenalty = comparator.validation.evidence_complete ? 0 : 0.35;
  const governancePenalty = comparator.validation.governance_validated ? 0 : 0.4;
  const replayPenalty = comparator.validation.replay_validated ? 0 : 0.35;
  const dimensionAdjustments: Partial<Record<RecommendationQualityDimension, number>> = {
    USEFULNESS: comparator.alignment.alignment_score * 0.04,
    COMPLETENESS: comparator.validation.evidence_complete ? 0.02 : -0.2,
    CORRECTNESS: -Math.max(...comparator.variances.map((variance) => variance.absolute_variance)) * 0.18,
    EXPLAINABILITY: comparator.validation.explanations_complete ? 0.02 : -0.3,
    EVIDENCE_QUALITY: -evidencePenalty,
    CONFIDENCE_QUALITY: -comparator.variances.find((variance) => variance.comparison_domain === "CONFIDENCE")!.absolute_variance * 0.2,
    GOVERNANCE_COMPLIANCE: -governancePenalty,
    AUTHORITY_CORRECTNESS: -governancePenalty * 0.8,
    ALTERNATIVE_USEFULNESS: -0.01,
    ROLLBACK_USEFULNESS: -0.02,
    OPERATOR_USABILITY: -comparator.variances.find((variance) => variance.comparison_domain === "OPERATOR_BEHAVIOR")!.absolute_variance * 0.15,
  };
  if (scenario === "EVIDENCE_VERIFICATION_FAILURE" && dimension === "EVIDENCE_QUALITY") return 0.1;
  if (scenario === "REPLAY_DIVERGENCE") return Math.max(0, base - replayPenalty);
  return Number(Math.max(0, Math.min(1, base + (dimensionAdjustments[dimension] ?? 0))).toFixed(4));
}

function buildDimensionScores(comparator: ComparatorResult, profile: WeightingProfile, scenario: Scenario): readonly RecommendationDimensionScore[] {
  const dimensions = scenario === "MISSING_DIMENSION" ? RECOMMENDATION_QUALITY_DIMENSIONS.filter((dimension) => dimension !== "ROLLBACK_USEFULNESS") : RECOMMENDATION_QUALITY_DIMENSIONS;
  return freezeArray(dimensions.map((dimension) => {
    const raw = rawScoreForDimension(dimension, comparator, scenario);
    const weight = profile.weights[dimension];
    const base: Omit<RecommendationDimensionScore, "integrity_hash"> = {
      dimension,
      raw_score: raw,
      weight,
      weighted_score: Number((raw * weight).toFixed(6)),
      explanation: scenario === "MISSING_EXPLANATION" && dimension === "CORRECTNESS" ? "" : `${dimension.toLowerCase()} scored from comparator variance, effectiveness evidence, governance status, and approved weight ${weight}`,
      supporting_evidence_refs: scenario === "INCOMPLETE_EVIDENCE" ? freezeArray([]) : comparator.ledger_record.evidence_refs,
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function compositeFromScores(scores: readonly RecommendationDimensionScore[]): number {
  return Number(scores.reduce((sum, score) => sum + score.weighted_score, 0).toFixed(6));
}

function ratingForComposite(composite: number): RecommendationQualityRating {
  if (composite >= 0.95) return "EXCEPTIONAL";
  if (composite >= 0.85) return "HIGH";
  if (composite >= 0.75) return "GOOD";
  if (composite >= 0.65) return "ACCEPTABLE";
  if (composite >= 0.5) return "MARGINAL";
  if (composite >= 0.3) return "POOR";
  return "UNACCEPTABLE";
}

function dimensionValue(scores: readonly RecommendationDimensionScore[], dimension: RecommendationQualityDimension): number {
  return scores.find((score) => score.dimension === dimension)?.raw_score ?? 0;
}

function buildQualityScore(comparator: ComparatorResult, profile: WeightingProfile, scores: readonly RecommendationDimensionScore[], scenario: Scenario): RecommendationQualityScore {
  const effect = comparator.effectiveness.effectiveness_record;
  const composite = scenario === "COMPOSITE_MISMATCH" ? Number((compositeFromScores(scores) - 0.123).toFixed(6)) : compositeFromScores(scores);
  const base: Omit<RecommendationQualityScore, "integrity_hash"> = {
    quality_score_id: `quality_score_${hash(effect.effectiveness_id).slice(0, 14)}`,
    tenant_id: scenario === "CROSS_TENANT" ? `${effect.tenant_id}:foreign` : effect.tenant_id,
    mission_id: effect.mission_id,
    decision_id: effect.decision_id,
    recommendation_id: effect.recommendation_id,
    usefulness_score: dimensionValue(scores, "USEFULNESS"),
    completeness_score: dimensionValue(scores, "COMPLETENESS"),
    correctness_score: dimensionValue(scores, "CORRECTNESS"),
    explainability_score: dimensionValue(scores, "EXPLAINABILITY"),
    evidence_quality_score: dimensionValue(scores, "EVIDENCE_QUALITY"),
    confidence_quality_score: dimensionValue(scores, "CONFIDENCE_QUALITY"),
    governance_compliance_score: dimensionValue(scores, "GOVERNANCE_COMPLIANCE"),
    authority_correctness_score: dimensionValue(scores, "AUTHORITY_CORRECTNESS"),
    alternative_usefulness_score: dimensionValue(scores, "ALTERNATIVE_USEFULNESS"),
    rollback_usefulness_score: dimensionValue(scores, "ROLLBACK_USEFULNESS"),
    operator_usability_score: dimensionValue(scores, "OPERATOR_USABILITY"),
    dimension_scores: scores,
    composite_effectiveness_score: composite,
    quality_rating: ratingForComposite(composite),
    weighting_profile: profile,
    explanation: scenario === "MISSING_EXPLANATION" ? "" : `Composite score ${composite} produced from ${scores.length} deterministic weighted dimensions using ${profile.profile_id}@${profile.profile_version}`,
    supporting_evidence_refs: scenario === "INCOMPLETE_EVIDENCE" ? freezeArray([]) : comparator.ledger_record.evidence_refs,
    governance_refs: scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : comparator.ledger_record.governance_refs,
    replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : comparator.ledger_record.replay_refs,
    lineage_refs: scenario === "INCOMPLETE_LINEAGE" ? freezeArray([]) : comparator.effectiveness.effectiveness_record.lineage_refs,
    ledger_refs: freezeArray([comparator.ledger_record.ledger_record_id]),
    advisory_only: true,
    modifies_recommendation_behavior: false,
  };
  const score = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...score, integrity_hash: hash({ tampered: score.quality_score_id }) });
  return score;
}

function collectFailures(comparator: ComparatorResult, qualityScore: RecommendationQualityScore, profile: WeightingProfile, scenario: Scenario): readonly RecommendationQualityFailure[] {
  const failures: RecommendationQualityFailure[] = [];
  if (scenario === "MISSING_DIMENSION" || qualityScore.dimension_scores.length !== RECOMMENDATION_QUALITY_DIMENSIONS.length) failures.push("MANDATORY_DIMENSIONS_MISSING");
  if (scenario === "INCOMPLETE_EVIDENCE" || !qualityScore.supporting_evidence_refs.length || qualityScore.dimension_scores.some((score) => !score.supporting_evidence_refs.length)) failures.push("EVIDENCE_INCOMPLETE");
  if (scenario === "INVALID_WEIGHTING" || !profile.governance_approved || profile.weight_total !== 1) failures.push("WEIGHTING_PROFILE_INVALID");
  if (scenario === "MISSING_GOVERNANCE" || !qualityScore.governance_refs.length) failures.push("GOVERNANCE_VALIDATION_MISSING");
  if (scenario === "MISSING_REPLAY" || !qualityScore.replay_refs.length) failures.push("REPLAY_REFERENCES_MISSING");
  if (scenario === "INCOMPLETE_LINEAGE" || !qualityScore.lineage_refs.length) failures.push("LINEAGE_INCOMPLETE");
  if (scenario === "HASH_MISMATCH" || hashWithoutIntegrity(qualityScore) !== qualityScore.integrity_hash) failures.push("INTEGRITY_MISMATCH_DETECTED");
  if (scenario === "CROSS_TENANT" || qualityScore.tenant_id !== comparator.ledger_record.tenant_id) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "RECONSTRUCTION_FAILURE") failures.push("RECOMMENDATION_RECONSTRUCTION_FAILED");
  if (scenario === "EVIDENCE_VERIFICATION_FAILURE") failures.push("EVIDENCE_VERIFICATION_FAILED");
  if (scenario === "COMPOSITE_MISMATCH" || compositeFromScores(qualityScore.dimension_scores) !== qualityScore.composite_effectiveness_score) failures.push("COMPOSITE_SCORE_NOT_REPRODUCIBLE");
  if (scenario === "GOVERNANCE_FAILURE" || !comparator.validation.governance_validated) failures.push("GOVERNANCE_VALIDATION_FAILED");
  if (scenario === "CONSTITUTIONAL_FAILURE") failures.push("CONSTITUTIONAL_VALIDATION_FAILED");
  if (scenario === "REPLAY_DIVERGENCE" || !comparator.validation.replay_reconstruction_identical) failures.push("REPLAY_DIVERGENCE");
  if (scenario === "LEDGER_MUTATION" || !comparator.validation.ledger_recorded) failures.push("LEDGER_MUTATION_DETECTED");
  if (scenario === "MISSING_EXPLANATION" || !qualityScore.explanation || qualityScore.dimension_scores.some((score) => !score.explanation)) failures.push("EXPLANATION_MISSING");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateForFailures(failures: readonly RecommendationQualityFailure[]): RecommendationQualityValidation["state"] {
  if (failures.includes("EVIDENCE_INCOMPLETE")) return "PENDING_EVIDENCE";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildLedger(comparator: ComparatorResult, score: RecommendationQualityScore, scenario: Scenario): RecommendationQualityLedgerRecord {
  const base: Omit<RecommendationQualityLedgerRecord, "integrity_hash"> = {
    ledger_record_id: `quality_score_ledger_${hash(score.quality_score_id).slice(0, 14)}`,
    tenant_id: score.tenant_id,
    quality_score_id: score.quality_score_id,
    recommendation_ref: score.recommendation_id,
    decision_ref: score.decision_id,
    outcome_refs: comparator.ledger_record.observed_outcome_refs,
    comparator_ref: comparator.ledger_record.comparison_id,
    evidence_refs: score.supporting_evidence_refs,
    governance_refs: score.governance_refs,
    replay_refs: score.replay_refs,
    append_only: true,
    deleted: false,
    ledger_sequence: 1,
  };
  const ledger = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "LEDGER_MUTATION") return Object.freeze({ ...ledger, deleted: true, integrity_hash: ledger.integrity_hash });
  return ledger;
}

function buildValidation(comparator: ComparatorResult, score: RecommendationQualityScore, ledger: RecommendationQualityLedgerRecord, failures: readonly RecommendationQualityFailure[]): RecommendationQualityValidation {
  const scoreVerified = hashWithoutIntegrity(score) === score.integrity_hash;
  const ledgerVerified = hashWithoutIntegrity(ledger) === ledger.integrity_hash;
  const dimensionsComplete = RECOMMENDATION_QUALITY_DIMENSIONS.every((dimension) => score.dimension_scores.some((entry) => entry.dimension === dimension));
  const compositeReproducible = compositeFromScores(score.dimension_scores) === score.composite_effectiveness_score;
  const base: Omit<RecommendationQualityValidation, "integrity_hash"> = {
    validation_id: "recommendation_quality_scoring_validation",
    state: stateForFailures(failures),
    certified: failures.length === 0 && scoreVerified && ledgerVerified,
    failures,
    dimensions_complete: dimensionsComplete,
    weighting_valid: score.weighting_profile.governance_approved && score.weighting_profile.weight_total === 1,
    composite_reproducible: compositeReproducible,
    governance_validated: !failures.includes("GOVERNANCE_VALIDATION_MISSING") && !failures.includes("GOVERNANCE_VALIDATION_FAILED") && !failures.includes("CONSTITUTIONAL_VALIDATION_FAILED"),
    replay_validated: !failures.includes("REPLAY_REFERENCES_MISSING") && !failures.includes("REPLAY_DIVERGENCE") && replayExpectedVsActual(comparator),
    ledger_recorded: ledger.append_only && !ledger.deleted,
    explanations_complete: !failures.includes("EXPLANATION_MISSING"),
    evidence_complete: !failures.includes("EVIDENCE_INCOMPLETE") && !failures.includes("EVIDENCE_VERIFICATION_FAILED"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED") && score.tenant_id === comparator.ledger_record.tenant_id,
    integrity_verified: scoreVerified && ledgerVerified,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<RecommendationQualityResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    quality_score: result.quality_score,
    validation: result.validation,
    ledger: result.ledger_record,
    comparator_hash: result.comparator.replay_hash,
  });
}

function resultIntegrityHash(result: Omit<RecommendationQualityResult, "integrity_hash">): string {
  return hash({
    recommendation_quality_scoring_version: result.recommendation_quality_scoring_version,
    api_surface_hash: result.api_surface.integrity_hash,
    quality_score_hash: result.quality_score.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    ledger_hash: result.ledger_record.integrity_hash,
    comparator_hash: result.comparator.integrity_hash,
    replay_hash: result.replay_hash,
    deterministic: result.deterministic,
    replayable: result.replayable,
    advisory_only: result.advisory_only,
    quality_scoring_only: result.quality_scoring_only,
    adaptive_learning: result.adaptive_learning,
    modifies_recommendations: result.modifies_recommendations,
    modifies_outcomes: result.modifies_outcomes,
  });
}

export function scoreRecommendationQuality(input: RecommendationQualityInput = {}): RecommendationQualityResult {
  const scenario = input.scenario ?? "BASELINE";
  const comparator = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const weighting_profile = buildWeightingProfile(scenario);
  const dimension_scores = buildDimensionScores(comparator, weighting_profile, scenario);
  const quality_score = buildQualityScore(comparator, weighting_profile, dimension_scores, scenario);
  const failures = collectFailures(comparator, quality_score, weighting_profile, scenario);
  const ledger_record = buildLedger(comparator, quality_score, scenario);
  const validation = buildValidation(comparator, quality_score, ledger_record, failures);
  const base: Omit<RecommendationQualityResult, "integrity_hash" | "replay_hash"> = {
    recommendation_quality_scoring_version: QUALITY_SCORING_VERSION,
    comparator,
    api_surface,
    quality_score,
    validation,
    ledger_record,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    quality_scoring_only: true,
    adaptive_learning: false,
    modifies_recommendations: false,
    modifies_outcomes: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayRecommendationQuality(result: RecommendationQualityResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function computeRecommendationQualityHash(score: Omit<RecommendationQualityScore, "integrity_hash"> | RecommendationQualityScore): string {
  return hashWithoutIntegrity(score);
}

export function getRecommendationQualityFoundation(): RecommendationQualityFoundation {
  const api_surface = buildApiSurface();
  const weighting_profile = buildWeightingProfile();
  return Object.freeze({
    recommendation_quality_scoring_version: QUALITY_SCORING_VERSION,
    mandatory_dimensions: RECOMMENDATION_QUALITY_DIMENSIONS,
    weighting_profile,
    api_surface,
    result: scoreRecommendationQuality(),
  });
}

export const RecommendationQualityScoring = Object.freeze({
  score: scoreRecommendationQuality,
  replay: replayRecommendationQuality,
});
