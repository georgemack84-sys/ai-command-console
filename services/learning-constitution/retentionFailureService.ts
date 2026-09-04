import type { ReflectionCase, ReflectionPrerequisiteDiagnosis, ReflectionSelectedCause } from "../../types/learning-constitution/reflectionEngine";
import type { RetentionArtifactStore, RetentionEvidence, RetentionFailureClass, RetentionFailureDiagnosis, RetentionRecord } from "../../types/learning-constitution/retentionEngine";
import { ReflectionRemediationPlanner } from "./reflectionRemediationService";

const reflectionType: Record<RetentionFailureClass, RetentionFailureDiagnosis["reflectionFailureType"]> = { RECALL_FAILURE: "KNOWLEDGE_GAP", CONCEPTUAL_FAILURE: "MISUNDERSTANDING", APPLICATION_FAILURE: "PRINCIPLE_APPLICATION_ERROR", GENERALIZATION_FAILURE: "GENERALIZATION_ERROR", BOUNDARY_FAILURE: "BOUNDARY_RECOGNITION_ERROR", EXCEPTION_FAILURE: "EXCEPTION_RECOGNITION_ERROR", PREREQUISITE_FAILURE: "PREREQUISITE_GAP", CALIBRATION_FAILURE: "CONFIDENCE_CALIBRATION_ERROR" };

/** Retention failure is evidence of a scoped weakness, never a reason to replay an entire original lesson. */
export class RetentionFailureService {
  constructor(private readonly artifacts: RetentionArtifactStore) {}
  async diagnose(input: Readonly<{ diagnosisId: string; record: RetentionRecord; evidence: RetentionEvidence; failureClass: RetentionFailureClass; prerequisite: ReflectionPrerequisiteDiagnosis; createdAt: string }>): Promise<RetentionFailureDiagnosis> {
    if (input.evidence.retentionId !== input.record.retentionId || input.evidence.skillId !== input.record.skillId || input.evidence.outcome !== "FAIL" || input.evidence.validity !== "VALID") throw new Error("retention failure diagnosis requires valid failed retention evidence");
    const prerequisiteMismatch = input.failureClass === "PREREQUISITE_FAILURE" && input.prerequisite.status !== "RECOMMENDED";
    const diagnosis: RetentionFailureDiagnosis = { diagnosisId: input.diagnosisId, retentionId: input.record.retentionId, evidenceId: input.evidence.evidenceId, skillId: input.record.skillId, failureClass: input.failureClass, reflectionFailureType: reflectionType[input.failureClass], targetSkillId: prerequisiteMismatch ? null : input.failureClass === "PREREQUISITE_FAILURE" ? input.prerequisite.targetSkillId : input.record.skillId, status: prerequisiteMismatch ? "INSUFFICIENT_EVIDENCE" : "LOCALIZED", rationale: prerequisiteMismatch ? "The Skill Graph did not support attributing this retention failure to a prerequisite." : `Retention failure was localized as ${input.failureClass}.`, createdAt: input.createdAt, durableKnowledgeEffect: "NONE", executionPermissionGranted: false };
    await this.artifacts.append({ artifactId: `RETENTION_FAILURE_DIAGNOSIS:${diagnosis.diagnosisId}`, artifactType: "FAILURE_DIAGNOSIS", subjectId: input.record.retentionId, payload: diagnosis, createdAt: input.createdAt });
    return diagnosis;
  }

  reflectionCase(input: Readonly<{ reflectionId: string; record: RetentionRecord; evidence: RetentionEvidence; diagnosis: RetentionFailureDiagnosis; actor: import("../../types/learning-constitution/provenance").ProvenanceActor }>): ReflectionCase {
    return { reflectionId: input.reflectionId, trigger: "EVALUATION_FAILURE", evaluationId: input.evidence.evaluationReferenceId, skillId: input.record.skillId, expectedOutcome: "Independent delayed retention demonstration.", observedOutcome: input.diagnosis.failureClass, failureType: input.diagnosis.reflectionFailureType, failureLocation: input.diagnosis.failureClass === "CALIBRATION_FAILURE" ? "CALIBRATE_CONFIDENCE" : input.diagnosis.failureClass === "BOUNDARY_FAILURE" || input.diagnosis.failureClass === "EXCEPTION_FAILURE" ? "CHECK_APPLICABILITY" : "APPLY_PRINCIPLE", relevantKnowledgeIds: [], relevantPrincipleIds: [], relevantProcedureIds: [], relevantExampleIds: [], relevantExceptionIds: [], prerequisiteSkillIds: input.diagnosis.targetSkillId && input.diagnosis.targetSkillId !== input.record.skillId ? [input.diagnosis.targetSkillId] : [], status: input.diagnosis.status === "LOCALIZED" ? "CAUSE_IDENTIFIED" : "INSUFFICIENT_EVIDENCE", createdBy: input.actor, createdAt: input.diagnosis.createdAt, resolvedAt: null, masteryEffect: "NONE", durableKnowledgeEffect: "NONE", executionPermissionGranted: false };
  }

  remediation(input: Readonly<{ planId: string; reflection: ReflectionCase; diagnosis: RetentionFailureDiagnosis; prerequisite: ReflectionPrerequisiteDiagnosis; actor: import("../../types/learning-constitution/provenance").ProvenanceActor; createdAt: string }>) {
    if (input.diagnosis.status !== "LOCALIZED") throw new Error("insufficiently localized retention failures require a diagnostic review, not remediation");
    const selected: ReflectionSelectedCause = { reflectionId: input.reflection.reflectionId, causeId: `retention-cause:${input.diagnosis.diagnosisId}`, failureType: input.reflection.failureType, confidence: .75, selectionReason: input.diagnosis.rationale, selectedBy: input.actor, selectedAt: input.createdAt, status: "SELECTED" };
    return new ReflectionRemediationPlanner().plan({ planId: input.planId, reflection: input.reflection, selected, prerequisite: input.prerequisite, createdAt: input.createdAt });
  }
}
