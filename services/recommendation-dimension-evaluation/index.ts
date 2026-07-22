import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { analyzeOverride, replayOverrideAnalysis } from "@/services/override-analysis-engine";
import type { OverrideAnalysisInput, OverrideAnalysisResult } from "@/types/override-analysis-engine";
import type {
  DimensionEvaluationApiSurface,
  DimensionEvaluationFailure,
  DimensionEvaluationFoundation,
  DimensionEvaluationInput,
  DimensionEvaluationLedgerRecord,
  DimensionEvaluationResult,
  DimensionEvaluationValidation,
  DimensionRating,
  DimensionScoreRecord,
  RecommendationDimension,
  RecommendationDimensionEvaluationRecord,
} from "@/types/recommendation-dimension-evaluation";

const DIMENSION_EVALUATION_VERSION = "recommendation-dimension-evaluation/v1" as const;

export const RECOMMENDATION_DIMENSIONS: readonly RecommendationDimension[] = Object.freeze([
  "EVIDENCE",
  "RISK",
  "CONFIDENCE",
  "GOVERNANCE",
  "EXPLAINABILITY",
  "ALTERNATIVES",
  "ROLLBACK",
]);

type Scenario = NonNullable<DimensionEvaluationInput["scenario"]>;

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

function sourceForScenario(input: DimensionEvaluationInput, scenario: Scenario): OverrideAnalysisResult {
  if (input.override) return input.override;
  const overrideScenario: OverrideAnalysisInput["scenario"] =
    scenario === "MISSING_EVIDENCE" || scenario === "EVIDENCE_INTEGRITY_FAILURE" ? "INCOMPLETE_EVIDENCE" :
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
    "BASELINE";
  return analyzeOverride({ scenario: overrideScenario });
}

function buildApiSurface(): DimensionEvaluationApiSurface {
  const base: Omit<DimensionEvaluationApiSurface, "integrity_hash"> = {
    api_id: "recommendation_dimension_evaluation_api",
    evaluate_dimensions: "POST /recommendation-dimension-evaluation/evaluate",
    evaluate_evidence: "POST /recommendation-dimension-evaluation/evidence",
    evaluate_risk: "POST /recommendation-dimension-evaluation/risk",
    evaluate_confidence: "POST /recommendation-dimension-evaluation/confidence",
    evaluate_governance: "POST /recommendation-dimension-evaluation/governance",
    evaluate_explainability: "POST /recommendation-dimension-evaluation/explainability",
    evaluate_alternatives: "POST /recommendation-dimension-evaluation/alternatives",
    evaluate_rollback: "POST /recommendation-dimension-evaluation/rollback",
    validate_evaluation: "POST /recommendation-dimension-evaluation/validate",
    replay_evaluation: "POST /recommendation-dimension-evaluation/replay",
    retrieve_contract: "GET /recommendation-dimension-evaluation/contract",
    update_supported: false,
    delete_supported: false,
    adaptive_learning_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function targetScore(scenario: Scenario): number | undefined {
  const targets: Partial<Record<Scenario, number>> = {
    EXCEPTIONAL: 0.96,
    HIGH: 0.88,
    GOOD: 0.78,
    ADEQUATE: 0.68,
    LIMITED: 0.54,
    POOR: 0.38,
    UNACCEPTABLE: 0.18,
  };
  return targets[scenario];
}

function weakDimension(scenario: Scenario): RecommendationDimension | undefined {
  const weak: Partial<Record<Scenario, RecommendationDimension>> = {
    WEAK_EVIDENCE_ONLY: "EVIDENCE",
    WEAK_RISK_ONLY: "RISK",
    WEAK_CONFIDENCE_ONLY: "CONFIDENCE",
    WEAK_GOVERNANCE_ONLY: "GOVERNANCE",
    WEAK_EXPLAINABILITY_ONLY: "EXPLAINABILITY",
    WEAK_ALTERNATIVES_ONLY: "ALTERNATIVES",
    WEAK_ROLLBACK_ONLY: "ROLLBACK",
  };
  return weak[scenario];
}

function ratingFor(score: number): DimensionRating {
  if (score >= 0.95) return "EXCEPTIONAL";
  if (score >= 0.85) return "HIGH";
  if (score >= 0.75) return "GOOD";
  if (score >= 0.65) return "ADEQUATE";
  if (score >= 0.5) return "LIMITED";
  if (score >= 0.3) return "POOR";
  return "UNACCEPTABLE";
}

function baseScoreFor(dimension: RecommendationDimension, override: OverrideAnalysisResult, scenario: Scenario): number {
  const target = targetScore(scenario);
  if (target !== undefined) return target;
  if (weakDimension(scenario) === dimension) return 0.42;
  const q = override.rejection.quality.quality_score;
  const map: Record<RecommendationDimension, number> = {
    EVIDENCE: q.evidence_quality_score,
    RISK: Math.min(1, (q.correctness_score + q.usefulness_score) / 2),
    CONFIDENCE: q.confidence_quality_score,
    GOVERNANCE: q.governance_compliance_score,
    EXPLAINABILITY: q.explainability_score,
    ALTERNATIVES: q.alternative_usefulness_score,
    ROLLBACK: q.rollback_usefulness_score,
  };
  return Number(Math.max(0, Math.min(1, map[dimension])).toFixed(4));
}

function findingsFor(dimension: RecommendationDimension, score: number): readonly string[] {
  return freezeArray([`${dimension.toLowerCase()} dimension rated ${ratingFor(score).toLowerCase()} at ${score}`]);
}

function improvementsFor(dimension: RecommendationDimension, score: number): readonly string[] {
  if (score >= 0.75) return freezeArray([`${dimension.toLowerCase()} dimension should be maintained`]);
  const map: Record<RecommendationDimension, string> = {
    EVIDENCE: "improve evidence completeness, credibility, sufficiency, and relevance",
    RISK: "improve risk severity, probability, and mitigation characterization",
    CONFIDENCE: "improve confidence calibration and uncertainty communication",
    GOVERNANCE: "improve constitutional, authority, approval, and policy guidance",
    EXPLAINABILITY: "improve recommendation clarity, reasoning transparency, and operator readability",
    ALTERNATIVES: "improve alternative diversity, feasibility, and tradeoff explanation",
    ROLLBACK: "improve rollback readiness, recovery usefulness, and contingency planning",
  };
  return freezeArray([map[dimension]]);
}

function buildDimensionScores(override: OverrideAnalysisResult, scenario: Scenario): readonly DimensionScoreRecord[] {
  const dimensions = scenario === "INCOMPLETE_DIMENSIONS" ? RECOMMENDATION_DIMENSIONS.filter((dimension) => dimension !== "ROLLBACK") : RECOMMENDATION_DIMENSIONS;
  return freezeArray(dimensions.map((dimension) => {
    const score = baseScoreFor(dimension, override, scenario);
    const evidenceRefs = scenario === "MISSING_EVIDENCE" && dimension === "EVIDENCE" ? freezeArray([]) : override.override_record.supporting_evidence_refs;
    const base: Omit<DimensionScoreRecord, "integrity_hash"> = {
      dimension_score_id: `dimension_score_${hash(`${override.override_record.override_analysis_id}:${dimension}`).slice(0, 14)}`,
      dimension,
      score,
      rating: ratingFor(score),
      findings: findingsFor(dimension, score),
      strengths: score >= 0.75 ? freezeArray([`${dimension.toLowerCase()} controls are strong`]) : freezeArray([]),
      weaknesses: score < 0.75 ? freezeArray([`${dimension.toLowerCase()} requires focused review`]) : freezeArray([]),
      improvement_opportunities: improvementsFor(dimension, score),
      explanation: scenario === "MISSING_EXPLANATION" && dimension === "EXPLAINABILITY" ? "" : `${dimension.toLowerCase()} scored independently from supporting evidence and replayed override analysis`,
      supporting_evidence_refs: evidenceRefs,
      governance_refs: scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : override.override_record.governance_refs,
      replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : override.override_record.replay_refs,
      lineage_refs: scenario === "INCOMPLETE_LINEAGE" ? freezeArray([]) : override.override_record.lineage_refs,
      independent: true,
    };
    const record = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
    if (scenario === "HASH_MISMATCH" && dimension === "EVIDENCE") return Object.freeze({ ...record, integrity_hash: hash({ tampered: record.dimension_score_id }) });
    return record;
  }));
}

function dimensionScore(scores: readonly DimensionScoreRecord[], dimension: RecommendationDimension): number {
  return scores.find((entry) => entry.dimension === dimension)?.score ?? 0;
}

function dimensionFindings(scores: readonly DimensionScoreRecord[], dimension: RecommendationDimension): readonly string[] {
  return scores.find((entry) => entry.dimension === dimension)?.findings ?? freezeArray([]);
}

function buildEvaluationRecord(override: OverrideAnalysisResult, scores: readonly DimensionScoreRecord[], scenario: Scenario): RecommendationDimensionEvaluationRecord {
  const source = override.override_record;
  const opportunities = freezeArray([...new Set(scores.flatMap((score) => score.improvement_opportunities))]);
  const evidenceRefs = freezeArray([...new Set(scores.flatMap((score) => score.supporting_evidence_refs))]);
  const governanceRefs = freezeArray([...new Set(scores.flatMap((score) => score.governance_refs))]);
  const replayRefs = freezeArray([...new Set(scores.flatMap((score) => score.replay_refs))]);
  const lineageRefs = freezeArray([...new Set(scores.flatMap((score) => score.lineage_refs))]);
  const base: Omit<RecommendationDimensionEvaluationRecord, "integrity_hash"> = {
    dimension_evaluation_id: `dimension_evaluation_${hash(source.override_analysis_id).slice(0, 14)}`,
    tenant_id: scenario === "CROSS_TENANT" ? `${source.tenant_id}:foreign` : source.tenant_id,
    mission_id: source.mission_id,
    decision_id: source.decision_id,
    recommendation_id: scenario === "MISSING_RECOMMENDATION" ? "" : source.recommendation_id,
    evidence_score: dimensionScore(scores, "EVIDENCE"),
    risk_score: dimensionScore(scores, "RISK"),
    confidence_score: dimensionScore(scores, "CONFIDENCE"),
    governance_score: dimensionScore(scores, "GOVERNANCE"),
    explainability_score: dimensionScore(scores, "EXPLAINABILITY"),
    alternatives_score: dimensionScore(scores, "ALTERNATIVES"),
    rollback_score: dimensionScore(scores, "ROLLBACK"),
    evidence_findings: dimensionFindings(scores, "EVIDENCE"),
    risk_findings: dimensionFindings(scores, "RISK"),
    confidence_findings: dimensionFindings(scores, "CONFIDENCE"),
    governance_findings: dimensionFindings(scores, "GOVERNANCE"),
    explainability_findings: dimensionFindings(scores, "EXPLAINABILITY"),
    alternatives_findings: dimensionFindings(scores, "ALTERNATIVES"),
    rollback_findings: dimensionFindings(scores, "ROLLBACK"),
    dimension_scores: scores,
    improvement_opportunities: opportunities,
    supporting_evidence_refs: evidenceRefs,
    governance_refs: governanceRefs,
    replay_refs: replayRefs,
    lineage_refs: lineageRefs,
    ledger_refs: freezeArray([override.ledger_record.ledger_record_id]),
    advisory_only: true,
    diagnostic_only: true,
    modifies_recommendation_behavior: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(override: OverrideAnalysisResult, record: RecommendationDimensionEvaluationRecord, scenario: Scenario): readonly DimensionEvaluationFailure[] {
  const failures: DimensionEvaluationFailure[] = [];
  if (scenario === "MISSING_RECOMMENDATION" || !record.recommendation_id) failures.push("RECOMMENDATION_UNAVAILABLE");
  if (scenario === "INCOMPLETE_DIMENSIONS" || record.dimension_scores.length !== RECOMMENDATION_DIMENSIONS.length) failures.push("DIMENSION_EVALUATION_INCOMPLETE");
  if (scenario === "MISSING_EVIDENCE" || !record.supporting_evidence_refs.length) failures.push("MANDATORY_EVIDENCE_MISSING");
  if (scenario === "MISSING_GOVERNANCE" || !record.governance_refs.length) failures.push("GOVERNANCE_VALIDATION_MISSING");
  if (scenario === "MISSING_REPLAY" || !record.replay_refs.length) failures.push("REPLAY_REFERENCES_MISSING");
  if (scenario === "INCOMPLETE_LINEAGE" || !record.lineage_refs.length) failures.push("LINEAGE_INCOMPLETE");
  if (scenario === "HASH_MISMATCH" || record.dimension_scores.some((score) => hashWithoutIntegrity(score) !== score.integrity_hash)) failures.push("INTEGRITY_MISMATCH_DETECTED");
  if (scenario === "CROSS_TENANT" || record.tenant_id !== override.ledger_record.tenant_id) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "RECONSTRUCTION_FAILURE") failures.push("RECOMMENDATION_RECONSTRUCTION_FAILED");
  if (scenario === "EVIDENCE_INTEGRITY_FAILURE") failures.push("EVIDENCE_INTEGRITY_FAILED");
  if (scenario === "GOVERNANCE_FAILURE" || !override.validation.governance_validated) failures.push("GOVERNANCE_VALIDATION_FAILED");
  if (scenario === "CONSTITUTIONAL_FAILURE") failures.push("CONSTITUTIONAL_VALIDATION_FAILED");
  if (scenario === "REPLAY_DIVERGENCE" || !override.validation.replay_validated) failures.push("REPLAY_DIVERGENCE");
  if (scenario === "LEDGER_MUTATION" || !override.validation.ledger_recorded) failures.push("LEDGER_MUTATION_DETECTED");
  if (scenario === "MISSING_EXPLANATION" || record.dimension_scores.some((score) => !score.explanation)) failures.push("EXPLANATION_MISSING");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateForFailures(failures: readonly DimensionEvaluationFailure[]): DimensionEvaluationValidation["state"] {
  if (failures.includes("MANDATORY_EVIDENCE_MISSING") || failures.includes("EVIDENCE_INTEGRITY_FAILED")) return "PENDING_EVIDENCE";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildLedger(record: RecommendationDimensionEvaluationRecord, scenario: Scenario): DimensionEvaluationLedgerRecord {
  const base: Omit<DimensionEvaluationLedgerRecord, "integrity_hash"> = {
    ledger_record_id: `dimension_evaluation_ledger_${hash(record.dimension_evaluation_id).slice(0, 14)}`,
    tenant_id: record.tenant_id,
    dimension_evaluation_id: record.dimension_evaluation_id,
    dimension_score_refs: record.dimension_scores.map((score) => score.dimension_score_id),
    recommendation_ref: record.recommendation_id,
    decision_ref: record.decision_id,
    evidence_refs: record.supporting_evidence_refs,
    governance_refs: record.governance_refs,
    replay_refs: record.replay_refs,
    append_only: true,
    deleted: false,
    ledger_sequence: 1,
  };
  const ledger = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "LEDGER_MUTATION") return Object.freeze({ ...ledger, deleted: true, integrity_hash: ledger.integrity_hash });
  return ledger;
}

function buildValidation(override: OverrideAnalysisResult, record: RecommendationDimensionEvaluationRecord, ledger: DimensionEvaluationLedgerRecord, failures: readonly DimensionEvaluationFailure[]): DimensionEvaluationValidation {
  const recordVerified = hashWithoutIntegrity(record) === record.integrity_hash;
  const scoreVerified = record.dimension_scores.every((score) => hashWithoutIntegrity(score) === score.integrity_hash);
  const ledgerVerified = hashWithoutIntegrity(ledger) === ledger.integrity_hash;
  const dimensionsComplete = RECOMMENDATION_DIMENSIONS.every((dimension) => record.dimension_scores.some((score) => score.dimension === dimension));
  const base: Omit<DimensionEvaluationValidation, "integrity_hash"> = {
    validation_id: "recommendation_dimension_evaluation_validation",
    state: stateForFailures(failures),
    certified: failures.length === 0 && recordVerified && scoreVerified && ledgerVerified,
    failures,
    dimensions_complete: dimensionsComplete,
    dimensions_independent: record.dimension_scores.every((score) => score.independent),
    governance_validated: !failures.includes("GOVERNANCE_VALIDATION_MISSING") && !failures.includes("GOVERNANCE_VALIDATION_FAILED") && !failures.includes("CONSTITUTIONAL_VALIDATION_FAILED"),
    replay_validated: !failures.includes("REPLAY_REFERENCES_MISSING") && !failures.includes("REPLAY_DIVERGENCE") && replayOverrideAnalysis(override),
    ledger_recorded: ledger.append_only && !ledger.deleted,
    evidence_complete: !failures.includes("MANDATORY_EVIDENCE_MISSING") && !failures.includes("EVIDENCE_INTEGRITY_FAILED"),
    explanations_complete: !failures.includes("EXPLANATION_MISSING"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED") && record.tenant_id === override.ledger_record.tenant_id,
    integrity_verified: recordVerified && scoreVerified && ledgerVerified,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<DimensionEvaluationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    evaluation_record: result.evaluation_record,
    validation: result.validation,
    ledger: result.ledger_record,
    override_hash: result.override.replay_hash,
  });
}

function resultIntegrityHash(result: Omit<DimensionEvaluationResult, "integrity_hash">): string {
  return hash({
    recommendation_dimension_evaluation_version: result.recommendation_dimension_evaluation_version,
    api_surface_hash: result.api_surface.integrity_hash,
    evaluation_hash: result.evaluation_record.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    ledger_hash: result.ledger_record.integrity_hash,
    override_hash: result.override.integrity_hash,
    replay_hash: result.replay_hash,
    deterministic: result.deterministic,
    replayable: result.replayable,
    advisory_only: result.advisory_only,
    diagnostic_only: result.diagnostic_only,
    dimensions_independent: result.dimensions_independent,
    adaptive_learning: result.adaptive_learning,
    modifies_recommendations: result.modifies_recommendations,
  });
}

export function evaluateRecommendationDimensions(input: DimensionEvaluationInput = {}): DimensionEvaluationResult {
  const scenario = input.scenario ?? "BASELINE";
  const override = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const dimension_scores = buildDimensionScores(override, scenario);
  const evaluation_record = buildEvaluationRecord(override, dimension_scores, scenario);
  const failures = collectFailures(override, evaluation_record, scenario);
  const ledger_record = buildLedger(evaluation_record, scenario);
  const validation = buildValidation(override, evaluation_record, ledger_record, failures);
  const base: Omit<DimensionEvaluationResult, "integrity_hash" | "replay_hash"> = {
    recommendation_dimension_evaluation_version: DIMENSION_EVALUATION_VERSION,
    override,
    api_surface,
    evaluation_record,
    validation,
    ledger_record,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    diagnostic_only: true,
    dimensions_independent: true,
    adaptive_learning: false,
    modifies_recommendations: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayRecommendationDimensionEvaluation(result: DimensionEvaluationResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function computeRecommendationDimensionEvaluationHash(record: Omit<RecommendationDimensionEvaluationRecord, "integrity_hash"> | RecommendationDimensionEvaluationRecord): string {
  return hashWithoutIntegrity(record);
}

export function getRecommendationDimensionEvaluationFoundation(): DimensionEvaluationFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    recommendation_dimension_evaluation_version: DIMENSION_EVALUATION_VERSION,
    dimensions: RECOMMENDATION_DIMENSIONS,
    api_surface,
    result: evaluateRecommendationDimensions(),
  });
}

export const RecommendationDimensionEvaluation = Object.freeze({
  evaluate: evaluateRecommendationDimensions,
  replay: replayRecommendationDimensionEvaluation,
});
