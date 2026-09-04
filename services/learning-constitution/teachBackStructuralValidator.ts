import type { TeachBack, TeachBackStructuralValidation } from "../../types/learning-constitution/teachBack";

/** Validates shape only; semantic comprehension is evaluated separately. */
export class TeachBackStructuralValidator {
  validate(teachBack: TeachBack): TeachBackStructuralValidation {
    const violations: string[] = [];
    for (const [name, value] of Object.entries({ teachBackId: teachBack.teachBackId, lessonId: teachBack.lessonId, teachingEventId: teachBack.teachingEventId, candidateKnowledgeId: teachBack.candidateKnowledgeId, lesson: teachBack.lesson, rationale: teachBack.rationale, scope: teachBack.scope, example: teachBack.example, counterexample: teachBack.counterexample, actor: teachBack.generatedBy.actorId })) if (!value.trim()) violations.push(`${name.toUpperCase()}_MISSING`);
    if (Number.isNaN(Date.parse(teachBack.generatedAt))) violations.push("GENERATED_AT_INVALID");
    if (!teachBack.immutable) violations.push("TEACH_BACK_MUST_BE_IMMUTABLE");
    return { valid: !violations.length, violations, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}
