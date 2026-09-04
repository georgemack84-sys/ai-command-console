import type { PracticeAdaptation, PracticeEvaluationResult, PracticeExercise, PracticeFailureType, PracticeTransferLevel } from "../../types/learning-constitution/practiceEngine";

const ladder: readonly PracticeTransferLevel[] = ["EXACT", "MODIFIED", "NOVEL", "AMBIGUOUS", "EDGE", "ADVERSARIAL"];
const nextLevel = (level: PracticeTransferLevel): PracticeTransferLevel => ladder[Math.min(ladder.indexOf(level) + 1, ladder.length - 1)]!;

/** Validates that practice evaluation distinguishes failures from valid judgment. */
export class PracticeEvaluationValidator {
  validate(exercise: PracticeExercise, result: PracticeEvaluationResult): Readonly<{ valid: boolean; reasonCodes: readonly string[]; masteryEffect: "NONE" }> {
    const reasons: string[] = [];
    const { evaluation, components } = result;
    if (evaluation.exerciseId !== exercise.exerciseId || evaluation.score < 0 || evaluation.score > 1) reasons.push("EVALUATION_IDENTITY_OR_SCORE_INVALID");
    if (evaluation.outcome === "CLARIFICATION_VALID" && exercise.transferLevel !== "AMBIGUOUS") reasons.push("CLARIFICATION_ONLY_VALID_FOR_AMBIGUITY");
    if ((evaluation.outcome === "FAIL" || evaluation.outcome === "PARTIAL") && !evaluation.failureTypes.length) reasons.push("FAILURE_CLASSIFICATION_REQUIRED");
    if ((evaluation.outcome === "PASS" || evaluation.outcome === "CLARIFICATION_VALID") && evaluation.failureTypes.length) reasons.push("SUCCESS_CANNOT_CARRY_FAILURE_CLASSIFICATION");
    if (exercise.targetSkillIds.length > 1 && (!components.length || exercise.targetSkillIds.some((skillId) => !components.some((component) => component.skillId === skillId)))) reasons.push("CROSS_SKILL_COMPONENT_EVALUATION_REQUIRED");
    if (components.some((component) => !exercise.targetSkillIds.includes(component.skillId)) || new Set(components.map((component) => component.skillId)).size !== components.length) reasons.push("COMPONENT_SKILL_MAPPING_INVALID");
    if (components.some((component) => (component.outcome === "FAIL" || component.outcome === "PARTIAL") && !component.failureTypes.length)) reasons.push("COMPONENT_FAILURE_CLASSIFICATION_REQUIRED");
    if (components.some((component) => (component.outcome === "PASS" || component.outcome === "CLARIFICATION_VALID") && component.failureTypes.length)) reasons.push("SUCCESS_COMPONENT_CANNOT_CARRY_FAILURE_CLASSIFICATION");
    if (components.some((component) => component.score < 0 || component.score > 1 || !component.rationale.trim())) reasons.push("COMPONENT_EVALUATION_INVALID");
    return { valid: reasons.length === 0, reasonCodes: reasons.length ? reasons : ["PRACTICE_EVALUATION_VALID"], masteryEffect: "NONE" };
  }
}

/** Conservative adaptation: a single good result raises challenge, never mastery. */
export class PracticeAdaptiveProgressionService {
  recommend(exercise: PracticeExercise, result: PracticeEvaluationResult): PracticeAdaptation {
    const { evaluation } = result;
    if (evaluation.outcome === "FAIL") return { action: "REMEDIATE", recommendedDifficulty: Math.max(0, Number((exercise.difficulty - 0.15).toFixed(2))), recommendedTransferLevel: exercise.transferLevel, remediationRequired: true, reason: `Failure classified as ${evaluation.failureTypes.join(", ")}; remediate before retesting.`, masteryEffect: "NONE" };
    if (evaluation.outcome === "PARTIAL") return { action: "REDUCE_DIFFICULTY", recommendedDifficulty: Math.max(0, Number((exercise.difficulty - 0.1).toFixed(2))), recommendedTransferLevel: exercise.transferLevel, remediationRequired: false, reason: "Partial performance warrants lower difficulty before increasing transfer.", masteryEffect: "NONE" };
    if (evaluation.outcome === "CLARIFICATION_VALID") return { action: "MAINTAIN", recommendedDifficulty: exercise.difficulty, recommendedTransferLevel: exercise.transferLevel, remediationRequired: false, reason: "Correctly identifying ambiguity demonstrates judgment; retain the current transfer level for corroboration.", masteryEffect: "NONE" };
    if (evaluation.score >= 0.8) return { action: "INCREASE_TRANSFER", recommendedDifficulty: Math.min(1, Number((exercise.difficulty + 0.05).toFixed(2))), recommendedTransferLevel: nextLevel(exercise.transferLevel), remediationRequired: false, reason: "Strong performance supports a modest increase in transfer challenge, not a mastery change.", masteryEffect: "NONE" };
    return { action: "MAINTAIN", recommendedDifficulty: exercise.difficulty, recommendedTransferLevel: exercise.transferLevel, remediationRequired: false, reason: "Passing performance needs corroboration at the current challenge level.", masteryEffect: "NONE" };
  }
}

/** Makes explicit classification evidence required rather than guessing why an answer failed. */
export class PracticeFailureClassificationService {
  classify(input: Readonly<{ assertedFailureTypes: readonly PracticeFailureType[]; supportingObservations: readonly string[] }>): readonly PracticeFailureType[] {
    if (!input.assertedFailureTypes.length || !input.supportingObservations.length || !input.supportingObservations.every((item) => item.trim())) throw new Error("failure classification requires explicit types and supporting observations");
    return [...new Set(input.assertedFailureTypes)];
  }
}
