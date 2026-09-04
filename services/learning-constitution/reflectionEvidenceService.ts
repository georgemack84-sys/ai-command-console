import type { EvaluationArtifactStore, EvaluationFailure, EvaluationScore, EvaluationValidity } from "../../types/learning-constitution/evaluationEngine";
import type { ReflectionEvidenceRef, ReflectionFailureType, ReflectionLocation } from "../../types/learning-constitution/reflectionEngine";

const mapping: Readonly<Record<EvaluationFailure["category"], Readonly<{ failureType: ReflectionFailureType; location: ReflectionLocation; priority: number }>>> = {
  KNOWLEDGE_GAP: { failureType: "KNOWLEDGE_GAP", location: "RETRIEVE_KNOWLEDGE", priority: 2 }, MISAPPLIED_RULE: { failureType: "PRINCIPLE_APPLICATION_ERROR", location: "APPLY_PRINCIPLE", priority: 6 }, OVERGENERALIZATION: { failureType: "OVERGENERALIZATION", location: "CHECK_APPLICABILITY", priority: 4 }, UNDERGENERALIZATION: { failureType: "UNDERGENERALIZATION", location: "APPLY_PRINCIPLE", priority: 6 }, BOUNDARY_FAILURE: { failureType: "BOUNDARY_RECOGNITION_ERROR", location: "CHECK_APPLICABILITY", priority: 4 }, EXCEPTION_FAILURE: { failureType: "EXCEPTION_RECOGNITION_ERROR", location: "CHECK_EXCEPTIONS", priority: 5 }, DEPENDENCY_FAILURE: { failureType: "PREREQUISITE_GAP", location: "RETRIEVE_KNOWLEDGE", priority: 1 }, INCONSISTENCY: { failureType: "INCONSISTENCY", location: "VERIFY_RESULT", priority: 7 }, CALIBRATION_FAILURE: { failureType: "CONFIDENCE_CALIBRATION_ERROR", location: "CALIBRATE_CONFIDENCE", priority: 8 }, REASONING_FAILURE: { failureType: "REASONING_ERROR", location: "VERIFY_RESULT", priority: 7 }, EXECUTION_FAILURE: { failureType: "PROCEDURAL_ERROR", location: "PROCEDURE_STEP", priority: 6 }, AMBIGUITY_FAILURE: { failureType: "CONTEXT_INTERPRETATION_ERROR", location: "INTERPRET_PROBLEM", priority: 0 }
};

/** Chooses the earliest evidenced divergence, never a downstream symptom when an earlier failure is known. */
export class ReflectionFailureLocalizationService {
  localize(failures: readonly EvaluationFailure[]): Readonly<{ failureType: ReflectionFailureType; location: ReflectionLocation; sourceFailureIds: readonly string[] }> {
    if (!failures.length) return { failureType: "UNKNOWN", location: "UNKNOWN", sourceFailureIds: [] };
    const earliest = [...failures].sort((left, right) => mapping[left.category].priority - mapping[right.category].priority)[0]!; const result = mapping[earliest.category];
    return { failureType: result.failureType, location: result.location, sourceFailureIds: failures.filter((failure) => mapping[failure.category].priority === result.priority).map((failure) => failure.failureId) };
  }
}

/** Reads only immutable Phase 21 artifacts and turns them into traceable reflection inputs. */
export class EvaluationReflectionEvidenceCollector {
  constructor(private readonly evaluations: EvaluationArtifactStore) {}
  async collect(evaluationId: string): Promise<Readonly<{ score: EvaluationScore; validity: EvaluationValidity; failures: readonly EvaluationFailure[]; evidence: readonly ReflectionEvidenceRef[] }>> {
    const artifacts = await this.evaluations.listWorkspaceArtifacts();
    const score = artifacts.find((artifact) => artifact.artifactType === "SCORE" && (artifact.payload as EvaluationScore).evaluationId === evaluationId)?.payload as EvaluationScore | undefined;
    const validity = artifacts.find((artifact) => artifact.artifactType === "VALIDITY" && (artifact.payload as EvaluationValidity).evaluationId === evaluationId)?.payload as EvaluationValidity | undefined;
    const failures = artifacts.filter((artifact) => artifact.artifactType === "FAILURE" && (artifact.payload as EvaluationFailure).evaluationId === evaluationId).map((artifact) => artifact.payload as EvaluationFailure);
    if (!score || !validity) throw new Error("reflection requires retained evaluation score and validity evidence");
    const evidence: ReflectionEvidenceRef[] = [{ evidenceId: `evaluation:${evaluationId}`, sourceType: "EVALUATION", sourceId: evaluationId, supports: validity.status === "VALID", note: `Evaluation validity is ${validity.status}.` }, { evidenceId: `score:${score.scoreId}`, sourceType: "EVALUATION", sourceId: score.scoreId, supports: score.outcome === "FAIL" || score.outcome === "PARTIAL", note: `Evaluation outcome is ${score.outcome} at ${score.overallScore}.` }, ...failures.map((failure) => ({ evidenceId: `failure:${failure.failureId}`, sourceType: "EVALUATION" as const, sourceId: failure.failureId, supports: true, note: failure.rationale }))];
    return { score, validity, failures, evidence };
  }
}
