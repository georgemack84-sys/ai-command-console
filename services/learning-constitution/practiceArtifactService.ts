import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";
import type { PracticeArtifactStore, PracticeAttempt, PracticeComponentEvaluation, PracticeEvaluation, PracticeEvaluationSpec, PracticeEvidence, PracticeExercise, PracticeExerciseState, PracticeRemediation, PracticeRemediationCompletion, PracticeRetestLink, PracticeSession } from "../../types/learning-constitution/practiceEngine";
import { PracticeExerciseLifecycleService, PracticeExerciseValidator } from "./practiceExerciseService";

/** Persists practice facts only; it deliberately has no durable-knowledge writer dependency. */
export class PracticeArtifactService {
  constructor(private readonly artifacts: PracticeArtifactStore, private readonly audit?: LearningAuditLedger) {}
  private async auditEvent(input: Readonly<{ eventId: string; eventType: import("../../types/learning-constitution/learningAuditLedger").LearningAuditEventType; workspaceId: string; occurredAt: string; actor: PracticeExercise["generation"]["generatedBy"]; correlationId: string; payload: Record<string, unknown> }>) {
    if (this.audit) await this.audit.append({ ...input, schemaVersion: "10.0", references: {}, payload: { ...input.payload, durableKnowledgeEffect: "NONE", executionPermissionGranted: false } });
  }
  async createExercise(exercise: PracticeExercise, spec: PracticeEvaluationSpec, workspaceId: string, correlationId: string): Promise<PracticeExercise> {
    const validation = new PracticeExerciseValidator().validate(exercise, spec);
    if (!validation.valid) throw new Error(`invalid practice exercise: ${validation.reasonCodes.join(", ")}`);
    await this.artifacts.append({ artifactId: `PRACTICE_EXERCISE:${exercise.exerciseId}`, artifactType: "EXERCISE", subjectId: exercise.exerciseId, payload: exercise, createdAt: exercise.generation.generatedAt });
    await this.artifacts.append({ artifactId: `PRACTICE_EVALUATION_SPEC:${exercise.exerciseId}:${spec.rubricVersion}`, artifactType: "EVALUATION_SPEC", subjectId: exercise.exerciseId, payload: spec, createdAt: exercise.generation.generatedAt });
    await this.auditEvent({ eventId: `audit:practice-exercise-generated:${exercise.exerciseId}`, eventType: "PRACTICE_EXERCISE_GENERATED", workspaceId, occurredAt: exercise.generation.generatedAt, actor: exercise.generation.generatedBy, correlationId, payload: { exerciseId: exercise.exerciseId, targetSkillIds: exercise.targetSkillIds, transferLevel: exercise.transferLevel, difficulty: exercise.difficulty, lineageSnapshotId: exercise.lineage.sourceSnapshotId } });
    return exercise;
  }
  async createSession(session: PracticeSession, workspaceId: string, correlationId: string): Promise<PracticeSession> {
    if (!session.sessionId.trim() || !session.targetSkillIds.length || !Number.isFinite(session.startingDifficulty) || session.startingDifficulty < 0 || session.startingDifficulty > 1) throw new Error("invalid practice session");
    await this.artifacts.append({ artifactId: `PRACTICE_SESSION:${session.sessionId}`, artifactType: "SESSION", subjectId: session.sessionId, payload: session, createdAt: session.createdAt });
    return session;
  }
  async transition(exercise: PracticeExercise, nextState: PracticeExerciseState, workspaceId: string, correlationId: string): Promise<PracticeExercise> {
    const transitioned = new PracticeExerciseLifecycleService().transition(exercise, nextState);
    await this.artifacts.append({ artifactId: `PRACTICE_LIFECYCLE:${exercise.exerciseId}:${nextState}`, artifactType: "LIFECYCLE", subjectId: exercise.exerciseId, payload: { exerciseId: exercise.exerciseId, previousState: exercise.state, nextState, occurredAt: exercise.generation.generatedAt }, createdAt: exercise.generation.generatedAt });
    const eventType = nextState === "VALIDATED" ? "PRACTICE_EXERCISE_VALIDATED" : nextState === "ASSIGNED" ? "PRACTICE_EXERCISE_ASSIGNED" : undefined;
    if (eventType) await this.auditEvent({ eventId: `audit:practice-exercise:${exercise.exerciseId}:${nextState}`, eventType, workspaceId, occurredAt: exercise.generation.generatedAt, actor: exercise.generation.generatedBy, correlationId, payload: { exerciseId: exercise.exerciseId, previousState: exercise.state, nextState } });
    return transitioned;
  }
  async recordAttempt(attempt: PracticeAttempt, actor: PracticeExercise["generation"]["generatedBy"], workspaceId: string, correlationId: string): Promise<PracticeAttempt> {
    if (!attempt.attemptId.trim() || !attempt.exerciseId.trim() || !attempt.learnerId.trim()) throw new Error("invalid practice attempt");
    await this.artifacts.append({ artifactId: `PRACTICE_ATTEMPT:${attempt.attemptId}`, artifactType: "ATTEMPT", subjectId: attempt.exerciseId, payload: attempt, createdAt: attempt.submittedAt });
    await this.auditEvent({ eventId: `audit:practice-attempt:${attempt.attemptId}`, eventType: "PRACTICE_ATTEMPT_RECORDED", workspaceId, occurredAt: attempt.submittedAt, actor, correlationId, payload: { attemptId: attempt.attemptId, exerciseId: attempt.exerciseId } });
    return attempt;
  }
  async recordEvaluation(evaluation: PracticeEvaluation, workspaceId: string, correlationId: string, components: readonly PracticeComponentEvaluation[] = []): Promise<PracticeEvaluation> {
    if (!evaluation.evaluationId.trim() || evaluation.score < 0 || evaluation.score > 1) throw new Error("invalid practice evaluation");
    await this.artifacts.append({ artifactId: `PRACTICE_EVALUATION:${evaluation.evaluationId}`, artifactType: "EVALUATION", subjectId: evaluation.exerciseId, payload: evaluation, createdAt: evaluation.evaluatedAt });
    for (const component of components) await this.artifacts.append({ artifactId: `PRACTICE_EVALUATION_COMPONENT:${evaluation.evaluationId}:${component.skillId}`, artifactType: "EVALUATION_COMPONENT", subjectId: component.skillId, payload: { evaluationId: evaluation.evaluationId, exerciseId: evaluation.exerciseId, ...component }, createdAt: evaluation.evaluatedAt });
    await this.auditEvent({ eventId: `audit:practice-evaluation:${evaluation.evaluationId}`, eventType: "PRACTICE_EXERCISE_EVALUATED", workspaceId, occurredAt: evaluation.evaluatedAt, actor: evaluation.evaluator, correlationId, payload: { evaluationId: evaluation.evaluationId, attemptId: evaluation.attemptId, exerciseId: evaluation.exerciseId, outcome: evaluation.outcome, score: evaluation.score, failureTypes: evaluation.failureTypes, components: components.map((component) => ({ skillId: component.skillId, outcome: component.outcome, score: component.score, failureTypes: component.failureTypes })) } });
    return evaluation;
  }
  async recordEvidence(evidence: PracticeEvidence, actor: PracticeExercise["generation"]["generatedBy"], workspaceId: string, correlationId: string): Promise<PracticeEvidence> {
    await this.artifacts.append({ artifactId: `PRACTICE_EVIDENCE:${evidence.evidenceId}`, artifactType: "EVIDENCE", subjectId: evidence.skillId, payload: evidence, createdAt: evidence.createdAt });
    await this.auditEvent({ eventId: `audit:practice-evidence:${evidence.evidenceId}`, eventType: "PRACTICE_EVIDENCE_CREATED", workspaceId, occurredAt: evidence.createdAt, actor, correlationId, payload: { evidenceId: evidence.evidenceId, skillId: evidence.skillId, exerciseId: evidence.exerciseId, strength: evidence.strength, skillRegistryEffect: evidence.skillRegistryEffect } });
    return evidence;
  }
  async createRemediation(remediation: PracticeRemediation, workspaceId: string, correlationId: string): Promise<PracticeRemediation> {
    if (!remediation.remediationId.trim() || !remediation.failedExerciseId.trim() || !remediation.failedEvaluationId.trim() || !remediation.targetSkillId.trim() || !remediation.remediationExerciseId.trim() || remediation.failedExerciseId === remediation.remediationExerciseId) throw new Error("invalid practice remediation linkage");
    const artifacts = await this.artifacts.listWorkspaceArtifacts();
    const failed = artifacts.find((artifact) => artifact.artifactType === "EVALUATION" && (artifact.payload as PracticeEvaluation).evaluationId === remediation.failedEvaluationId)?.payload as PracticeEvaluation | undefined;
    const remediationExercise = artifacts.find((artifact) => artifact.artifactType === "EXERCISE" && artifact.subjectId === remediation.remediationExerciseId)?.payload as PracticeExercise | undefined;
    if (!failed || failed.exerciseId !== remediation.failedExerciseId || (failed.outcome !== "FAIL" && failed.outcome !== "PARTIAL")) throw new Error("practice remediation requires a recorded failed or partial evaluation");
    if (!remediationExercise || !remediationExercise.targetSkillIds.includes(remediation.targetSkillId)) throw new Error("practice remediation exercise must target the diagnosed skill");
    await this.artifacts.append({ artifactId: `PRACTICE_REMEDIATION:${remediation.remediationId}`, artifactType: "REMEDIATION", subjectId: remediation.failedExerciseId, payload: remediation, createdAt: remediation.createdAt });
    await this.auditEvent({ eventId: `audit:practice-remediation:${remediation.remediationId}`, eventType: "PRACTICE_REMEDIATION_TRIGGERED", workspaceId, occurredAt: remediation.createdAt, actor: remediation.createdBy, correlationId, payload: { remediationId: remediation.remediationId, failedExerciseId: remediation.failedExerciseId, failedEvaluationId: remediation.failedEvaluationId, targetSkillId: remediation.targetSkillId, remediationExerciseId: remediation.remediationExerciseId, skillGraphPlanId: remediation.skillGraphPlanId } });
    return remediation;
  }
  async completeRemediation(completion: PracticeRemediationCompletion, workspaceId: string, correlationId: string): Promise<PracticeRemediationCompletion> {
    const artifacts = await this.artifacts.listWorkspaceArtifacts();
    const remediation = artifacts.find((artifact) => artifact.artifactType === "REMEDIATION" && (artifact.payload as PracticeRemediation).remediationId === completion.remediationId)?.payload as PracticeRemediation | undefined;
    const attempt = artifacts.find((artifact) => artifact.artifactType === "ATTEMPT" && (artifact.payload as PracticeAttempt).attemptId === completion.remediationAttemptId)?.payload as PracticeAttempt | undefined;
    if (!remediation || !attempt || attempt.exerciseId !== remediation.remediationExerciseId) throw new Error("practice remediation completion requires an attempt for its assigned exercise");
    await this.artifacts.append({ artifactId: `PRACTICE_REMEDIATION_COMPLETION:${completion.remediationId}`, artifactType: "REMEDIATION_COMPLETION", subjectId: remediation.failedExerciseId, payload: completion, createdAt: completion.completedAt });
    await this.auditEvent({ eventId: `audit:practice-remediation-completed:${completion.remediationId}`, eventType: "PRACTICE_REMEDIATION_COMPLETED", workspaceId, occurredAt: completion.completedAt, actor: completion.completedBy, correlationId, payload: { remediationId: completion.remediationId, remediationAttemptId: completion.remediationAttemptId, targetSkillId: remediation.targetSkillId } });
    return completion;
  }
  async authorizeRetest(link: PracticeRetestLink, workspaceId: string, correlationId: string): Promise<PracticeRetestLink> {
    const artifacts = await this.artifacts.listWorkspaceArtifacts();
    const remediation = artifacts.find((artifact) => artifact.artifactType === "REMEDIATION" && (artifact.payload as PracticeRemediation).remediationId === link.remediationId)?.payload as PracticeRemediation | undefined;
    const complete = artifacts.some((artifact) => artifact.artifactType === "REMEDIATION_COMPLETION" && (artifact.payload as PracticeRemediationCompletion).remediationId === link.remediationId);
    const original = artifacts.find((artifact) => artifact.artifactType === "EXERCISE" && artifact.subjectId === link.originalExerciseId)?.payload as PracticeExercise | undefined;
    const retest = artifacts.find((artifact) => artifact.artifactType === "EXERCISE" && artifact.subjectId === link.retestExerciseId)?.payload as PracticeExercise | undefined;
    if (!remediation || remediation.failedExerciseId !== link.originalExerciseId || !complete || !original || !retest || original.exerciseId === retest.exerciseId || original.lineage.sourceSnapshotId !== link.sourceSnapshotId || retest.lineage.sourceSnapshotId !== link.sourceSnapshotId) throw new Error("practice retest requires completed remediation and preserved source lineage");
    await this.artifacts.append({ artifactId: `PRACTICE_RETEST:${link.retestId}`, artifactType: "RETEST_LINK", subjectId: link.originalExerciseId, payload: link, createdAt: link.authorizedAt });
    await this.auditEvent({ eventId: `audit:practice-retest:${link.retestId}`, eventType: "PRACTICE_RETEST_AUTHORIZED", workspaceId, occurredAt: link.authorizedAt, actor: link.authorizedBy, correlationId, payload: { retestId: link.retestId, remediationId: link.remediationId, originalExerciseId: link.originalExerciseId, retestExerciseId: link.retestExerciseId, sourceSnapshotId: link.sourceSnapshotId } });
    return link;
  }
}
