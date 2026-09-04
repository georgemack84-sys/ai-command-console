import type { CompetenceEvaluationRubric, Evaluation, EvaluationCompetenceAssessment, EvaluationDimensionScores, EvaluationEvidence, EvaluationScore, EvaluationValidity } from "../../types/learning-constitution/evaluationEngine";
import { EVALUATION_DIMENSIONS } from "../../types/learning-constitution/evaluationEngine";

const rounded = (score: number) => Number(score.toFixed(4));
const emptyScores = (): EvaluationDimensionScores => Object.fromEntries(EVALUATION_DIMENSIONS.map((dimension) => [dimension, 0])) as EvaluationDimensionScores;

/** Produces a fully explainable competence projection; it cannot promote, demote, or mutate mastery. */
export class EvaluationCompetenceAssessmentService {
  assess(input: Readonly<{ assessmentId: string; skillId: string; rubric: CompetenceEvaluationRubric; analysis: import("../../types/learning-constitution/evaluationEngine").EvaluationAnalysis; evaluations: readonly Readonly<{ evaluation: Evaluation; score: EvaluationScore; validity: EvaluationValidity; evidence: EvaluationEvidence }>[]; analyzedAt: string }>): EvaluationCompetenceAssessment {
    if (input.rubric.skillId !== input.skillId || input.analysis.skillId !== input.skillId) throw new Error("competence assessment requires a matching skill rubric and analysis");
    const valid = input.evaluations.filter((item) => item.evaluation.skillId === input.skillId && item.validity.status === "VALID" && item.evidence.skillId === input.skillId && item.evidence.evaluationId === item.evaluation.evaluationId && item.score.evaluationId === item.evaluation.evaluationId);
    const dimensionAverages = valid.length ? Object.fromEntries(EVALUATION_DIMENSIONS.map((dimension) => [dimension, rounded(valid.reduce((sum, item) => sum + item.score.dimensionScores[dimension], 0) / valid.length)])) as EvaluationDimensionScores : emptyScores();
    const missingTypes = input.rubric.requiredEvaluationTypes.filter((type) => !valid.some((item) => item.evaluation.evaluationType === type));
    const belowThreshold = EVALUATION_DIMENSIONS.filter((dimension) => dimensionAverages[dimension] < input.rubric.dimensionThresholds[dimension]);
    const criticalFailures = input.rubric.criticalDimensions.filter((dimension) => belowThreshold.includes(dimension));
    const reasons: string[] = [];
    if (valid.length < 3) reasons.push("At least three valid independent evaluations are required.");
    if (missingTypes.length) reasons.push(`Required evaluation types missing: ${missingTypes.join(", ")}.`);
    if (belowThreshold.length) reasons.push(`Dimensions below rubric threshold: ${belowThreshold.join(", ")}.`);
    if (input.analysis.consistency.state !== "CONSISTENT") reasons.push(`Consistency is ${input.analysis.consistency.state}.`);
    if (input.analysis.calibration.state !== "WELL_CALIBRATED") reasons.push(`Calibration is ${input.analysis.calibration.state}.`);
    if (input.analysis.recency === "STALE" || input.analysis.recency === "REVALIDATION_REQUIRED" || input.analysis.recency === "NO_VALID_EVIDENCE") reasons.push(`Evidence recency is ${input.analysis.recency}.`);
    const eligible = valid.length >= 3 && !missingTypes.length && !belowThreshold.length && input.analysis.consistency.state === "CONSISTENT" && input.analysis.calibration.state === "WELL_CALIBRATED" && input.analysis.recency === "CURRENT";
    const status = input.analysis.recency === "STALE" || input.analysis.recency === "REVALIDATION_REQUIRED" ? "REVALIDATION_REQUIRED" : eligible ? "MASTERY_CANDIDATE" : !valid.length ? "INSUFFICIENT_EVIDENCE" : criticalFailures.length ? "DEVELOPING" : "SUPPORTED";
    return { assessmentId: input.assessmentId, skillId: input.skillId, status, eligibleForMasteryReview: eligible, dimensionAverages, requiredEvaluationTypesMissing: missingTypes, supportingEvidenceIds: valid.map((item) => item.evidence.evidenceId), reasons: reasons.length ? reasons : ["All evidence-based mastery-review conditions are satisfied; human-governed review remains required."], analyzedAt: input.analyzedAt, masteryEffect: "NONE", durableKnowledgeEffect: "NONE", executionPermissionGranted: false };
  }
}
