import type { TeachBackEvaluationEvidence, TeachBackEvaluationInput, TeachBackEvaluator as EvaluatorContract } from "../../types/learning-constitution/teachBack";

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();
const dimension = (pass: boolean) => pass ? "PASS" as const : "FAIL" as const;

/** Conservative deterministic evaluator; model scoring can be introduced behind this contract later. */
export class DeterministicTeachBackEvaluator implements EvaluatorContract {
  evaluate(input: TeachBackEvaluationInput): TeachBackEvaluationEvidence {
    const taught = normalize(input.taughtLesson); const lesson = normalize(input.teachBack.lesson);
    const fidelity = dimension(Boolean(lesson) && (lesson.includes(taught) || taught.includes(lesson) || lesson.split(" ").filter((word) => word.length > 4 && taught.includes(word)).length >= 2));
    const rationale = dimension(input.teachBack.rationale.trim().length >= 20);
    const scope = dimension(normalize(input.teachBack.scope).includes(normalize(input.expectedScope)) || normalize(input.expectedScope).includes(normalize(input.teachBack.scope)));
    const generalization = dimension(input.teachBack.example.trim().length >= 20 && !input.sourceExamples.map(normalize).includes(normalize(input.teachBack.example)));
    const exclusion = dimension(input.teachBack.counterexample.trim().length >= 20 && normalize(input.teachBack.counterexample) !== normalize(input.teachBack.example));
    const uncertainty = dimension(Array.isArray(input.teachBack.uncertainties));
    const hallucination = dimension(!/always|never/i.test(input.teachBack.rationale) || /never/i.test(input.taughtLesson));
    const dimensions = { fidelity, rationale, scope, generalization, exclusion, uncertainty, hallucination };
    const failed = Object.entries(dimensions).filter(([, value]) => value === "FAIL").map(([key]) => key);
    const outcome = !failed.length ? (input.teachBack.uncertainties.length ? "PASS_WITH_UNCERTAINTY" : "PASS") : failed.includes("fidelity") || failed.includes("scope") || failed.includes("hallucination") ? "FAIL" : "PARTIAL";
    return { evidenceId: `teach-back-evaluation:${input.teachBack.teachBackId}`, evidenceType: "TEACH_BACK_EVALUATION", subjectId: input.teachBack.candidateKnowledgeId, teachBackId: input.teachBack.teachBackId, evaluator: input.evaluator, outcome, dimensions, findings: failed.length ? failed.map((item) => `FAILED_${item.toUpperCase()}`) : ["COMPREHENSION_DEMONSTRATED"], createdAt: input.now, provenanceRefs: [input.teachBack.lessonId, input.teachBack.teachingEventId], immutable: true };
  }
}
