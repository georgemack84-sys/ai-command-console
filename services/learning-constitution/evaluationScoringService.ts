import type { CompetenceEvaluationRubric, Evaluation, EvaluationDimension, EvaluationDimensionMeasurement, EvaluationDimensionScores, EvaluationFailure, EvaluationFailureCategory, EvaluationScoringResult } from "../../types/learning-constitution/evaluationEngine";
import { EVALUATION_DIMENSIONS } from "../../types/learning-constitution/evaluationEngine";

const categoryFor: Readonly<Record<EvaluationDimension, EvaluationFailureCategory>> = { CORRECTNESS: "REASONING_FAILURE", APPLICATION: "MISAPPLIED_RULE", GENERALIZATION: "UNDERGENERALIZATION", BOUNDARY_RECOGNITION: "BOUNDARY_FAILURE", EXCEPTION_HANDLING: "EXCEPTION_FAILURE", CONSISTENCY: "INCONSISTENCY", CALIBRATION: "CALIBRATION_FAILURE" };
const scoreMap = (measurements: readonly EvaluationDimensionMeasurement[]): EvaluationDimensionScores => Object.fromEntries(measurements.map((measurement) => [measurement.dimension, measurement.score])) as EvaluationDimensionScores;

/** Converts declared measurements into an inspectable result; it never scores an answer by self-assertion. */
export class EvaluationRubricEngine {
  score(input: Readonly<{ evaluation: Evaluation; rubric: CompetenceEvaluationRubric; measurements: readonly EvaluationDimensionMeasurement[]; scoreId: string; scoredAt: string; scoringReliable: boolean }>): EvaluationScoringResult {
    const { evaluation, rubric, measurements } = input;
    if (evaluation.skillId !== rubric.skillId || evaluation.rubricId !== rubric.rubricId || evaluation.rubricVersion !== rubric.version) throw new Error("evaluation scoring requires its frozen matching rubric");
    if (measurements.length !== EVALUATION_DIMENSIONS.length || new Set(measurements.map((measurement) => measurement.dimension)).size !== EVALUATION_DIMENSIONS.length || measurements.some((measurement) => !Number.isFinite(measurement.score) || measurement.score < 0 || measurement.score > 1 || !measurement.rationale.trim())) throw new Error("evaluation scoring requires one bounded, explained measurement for every dimension");
    const dimensions = scoreMap(measurements); const failed = EVALUATION_DIMENSIONS.filter((dimension) => dimensions[dimension] < rubric.dimensionThresholds[dimension]); const criticalDimensionsFailed = failed.filter((dimension) => rubric.criticalDimensions.includes(dimension));
    const outcome = !input.scoringReliable ? "NEEDS_REVIEW" : criticalDimensionsFailed.length ? "FAIL" : failed.length ? "PARTIAL" : "PASS";
    const failures: EvaluationFailure[] = failed.map((dimension) => { const measurement = measurements.find((item) => item.dimension === dimension)!; return { failureId: `evaluation-failure:${evaluation.evaluationId}:${dimension}`, evaluationId: evaluation.evaluationId, dimension, category: categoryFor[dimension], relatedSkillId: measurement.relatedSkillId, rationale: measurement.rationale, createdAt: input.scoredAt }; });
    const overallScore = Number((EVALUATION_DIMENSIONS.reduce((total, dimension) => total + dimensions[dimension], 0) / EVALUATION_DIMENSIONS.length).toFixed(4));
    return { score: { scoreId: input.scoreId, evaluationId: evaluation.evaluationId, dimensionScores: dimensions, overallScore, outcome, scoredAt: input.scoredAt }, failures, criticalDimensionsFailed, outcomeReason: !input.scoringReliable ? "Scoring reliability is insufficient; human or independent review is required." : criticalDimensionsFailed.length ? `Critical dimensions failed: ${criticalDimensionsFailed.join(", ")}.` : failed.length ? `Below-rubric dimensions: ${failed.join(", ")}.` : "All rubric dimensions meet their thresholds." };
  }
}
