import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";
import type { CompetenceEvaluationRubric, Evaluation, EvaluationAnalysis, EvaluationArtifactStore, EvaluationCompetenceAssessment, EvaluationDimensionScores, EvaluationEvidence, EvaluationFailure, EvaluationLifecycleEvent, EvaluationLifecycleState, EvaluationResponse, EvaluationScore, EvaluationValidity } from "../../types/learning-constitution/evaluationEngine";
import { EVALUATION_DIMENSIONS } from "../../types/learning-constitution/evaluationEngine";

const validScores = (scores: EvaluationDimensionScores) => EVALUATION_DIMENSIONS.every((dimension) => Number.isFinite(scores[dimension]) && scores[dimension] >= 0 && scores[dimension] <= 1);

/** Validity rejects leaked, incomplete, or self-authorized evaluations before they can become skill evidence. */
export class EvaluationValidityService {
  validate(input: Readonly<{ evaluation: Evaluation; score: EvaluationScore; responses: readonly EvaluationResponse[]; rubric: CompetenceEvaluationRubric; failures: readonly EvaluationFailure[] }>): EvaluationValidity {
    const reasons: string[] = []; const { evaluation, score, responses, rubric, failures } = input;
    if (!evaluation.context.contextId.trim() || !evaluation.context.frozenAt.trim()) reasons.push("CONTEXT_NOT_FROZEN");
    if (evaluation.context.providedHints.length || evaluation.context.hiddenReferenceIds.some((id) => evaluation.context.allowedKnowledgeIds.includes(id) || evaluation.context.exposedExampleIds.includes(id))) reasons.push("EVALUATION_INFORMATION_LEAK");
    if (!evaluation.evaluator.independent || evaluation.evaluator.actor.actorType === "AGENT") reasons.push("EVALUATOR_NOT_INDEPENDENT");
    if (evaluation.rubricId !== rubric.rubricId || evaluation.rubricVersion !== rubric.version || rubric.skillId !== evaluation.skillId) reasons.push("RUBRIC_MISMATCH");
    if (!evaluation.exerciseIds.length || responses.length !== evaluation.exerciseIds.length || responses.some((response) => response.evaluationId !== evaluation.evaluationId || !evaluation.exerciseIds.includes(response.exerciseId))) reasons.push("RESPONSE_COVERAGE_INVALID");
    if (!validScores(score.dimensionScores) || !Number.isFinite(score.overallScore) || score.overallScore < 0 || score.overallScore > 1) reasons.push("SCORES_INVALID");
    if (score.outcome !== "INVALID" && failures.some((failure) => failure.evaluationId !== evaluation.evaluationId || !failure.rationale.trim())) reasons.push("FAILURE_ANALYSIS_INVALID");
    const status = reasons.length ? "INVALID" : "VALID";
    return { validityId: `evaluation-validity:${evaluation.evaluationId}`, evaluationId: evaluation.evaluationId, status, reasonCodes: reasons.length ? reasons : ["EVALUATION_VALID"], checkedAt: score.scoredAt };
  }
}

const allowed: Readonly<Record<EvaluationLifecycleState | "NONE", readonly EvaluationLifecycleState[]>> = { NONE: ["CREATED"], CREATED: ["READY"], READY: ["RUNNING"], RUNNING: ["SCORING"], SCORING: ["VALIDATING"], VALIDATING: ["COMPLETED"], COMPLETED: [] };
/** State transitions are validated separately from the immutable evaluation fact. */
export class EvaluationLifecycleService { transition(previousState: EvaluationLifecycleState | null, nextState: EvaluationLifecycleState): void { if (!allowed[previousState ?? "NONE"].includes(nextState)) throw new Error(`invalid evaluation lifecycle transition: ${previousState ?? "NONE"} -> ${nextState}`); } }

/** Immutable evaluation spine. It has no dependency on a durable-knowledge writer or mastery mutator. */
export class EvaluationArtifactService {
  constructor(private readonly artifacts: EvaluationArtifactStore, private readonly audit?: LearningAuditLedger) {}
  async record(input: Readonly<{ evaluation: Evaluation; rubric: CompetenceEvaluationRubric; responses: readonly EvaluationResponse[]; score: EvaluationScore; failures: readonly EvaluationFailure[]; validity: EvaluationValidity; evidence?: EvaluationEvidence }>, workspaceId: string, correlationId: string): Promise<Readonly<{ validity: EvaluationValidity; evidence?: EvaluationEvidence }>> {
    const { evaluation, rubric, responses, score, failures, validity, evidence } = input;
    if (validity.evaluationId !== evaluation.evaluationId) throw new Error("evaluation validity must match its evaluation");
    if (evidence && (validity.status !== "VALID" || evidence.evaluationId !== evaluation.evaluationId || evidence.skillId !== evaluation.skillId || evidence.validityId !== validity.validityId)) throw new Error("evaluation evidence requires a valid matching evaluation");
    await this.artifacts.append({ artifactId: `EVALUATION_RUBRIC:${rubric.rubricId}:${rubric.version}`, artifactType: "RUBRIC", subjectId: rubric.skillId, payload: rubric, createdAt: rubric.createdAt });
    await this.artifacts.append({ artifactId: `EVALUATION:${evaluation.evaluationId}`, artifactType: "EVALUATION", subjectId: evaluation.skillId, payload: evaluation, createdAt: evaluation.createdAt });
    for (const response of responses) await this.artifacts.append({ artifactId: `EVALUATION_RESPONSE:${response.responseId}`, artifactType: "RESPONSE", subjectId: evaluation.evaluationId, payload: response, createdAt: response.capturedAt });
    await this.artifacts.append({ artifactId: `EVALUATION_SCORE:${score.scoreId}`, artifactType: "SCORE", subjectId: evaluation.evaluationId, payload: score, createdAt: score.scoredAt });
    for (const failure of failures) await this.artifacts.append({ artifactId: `EVALUATION_FAILURE:${failure.failureId}`, artifactType: "FAILURE", subjectId: evaluation.evaluationId, payload: failure, createdAt: failure.createdAt });
    await this.artifacts.append({ artifactId: `EVALUATION_VALIDITY:${validity.validityId}`, artifactType: "VALIDITY", subjectId: evaluation.evaluationId, payload: validity, createdAt: validity.checkedAt });
    if (evidence) { await this.artifacts.append({ artifactId: `EVALUATION_EVIDENCE:${evidence.evidenceId}`, artifactType: "EVIDENCE", subjectId: evidence.skillId, payload: evidence, createdAt: evidence.createdAt }); if (this.audit) await this.audit.append({ eventId: `audit:evaluation-evidence:${evidence.evidenceId}`, eventType: "SKILL_EVALUATION_COMPLETED", workspaceId, occurredAt: evidence.createdAt, actor: evidence.evaluator.actor, correlationId, schemaVersion: "10.0", references: {}, payload: { evaluationId: evidence.evaluationId, skillId: evidence.skillId, evidenceId: evidence.evidenceId, durableKnowledgeEffect: "NONE", executionPermissionGranted: false } }); }
    return { validity, evidence };
  }
  async recordAnalysis(analysis: EvaluationAnalysis): Promise<EvaluationAnalysis> { await this.artifacts.append({ artifactId: `EVALUATION_ANALYSIS:${analysis.analysisId}`, artifactType: "ANALYSIS", subjectId: analysis.skillId, payload: analysis, createdAt: analysis.analyzedAt }); return analysis; }
  async recordAssessment(assessment: EvaluationCompetenceAssessment): Promise<EvaluationCompetenceAssessment> { await this.artifacts.append({ artifactId: `EVALUATION_ASSESSMENT:${assessment.assessmentId}`, artifactType: "ASSESSMENT", subjectId: assessment.skillId, payload: assessment, createdAt: assessment.analyzedAt }); return assessment; }
  async recordResponse(response: EvaluationResponse): Promise<EvaluationResponse> { if (!response.responseId.trim() || !response.evaluationId.trim() || !response.exerciseId.trim() || (response.selfReportedConfidence !== null && (!Number.isFinite(response.selfReportedConfidence) || response.selfReportedConfidence < 0 || response.selfReportedConfidence > 1))) throw new Error("invalid evaluation response"); await this.artifacts.append({ artifactId: `EVALUATION_RESPONSE:${response.responseId}`, artifactType: "RESPONSE", subjectId: response.evaluationId, payload: response, createdAt: response.capturedAt }); return response; }
  async initialize(evaluation: Evaluation, rubric: CompetenceEvaluationRubric, workspaceId: string, correlationId: string): Promise<EvaluationLifecycleEvent> {
    if (!evaluation.evaluationId.trim() || !evaluation.skillId.trim() || !evaluation.exerciseIds.length || !evaluation.context.contextId.trim() || !evaluation.context.frozenAt.trim() || evaluation.rubricId !== rubric.rubricId || evaluation.rubricVersion !== rubric.version || rubric.skillId !== evaluation.skillId) throw new Error("evaluation initialization requires a frozen context, exercise, and matching rubric");
    await this.artifacts.append({ artifactId: `EVALUATION_RUBRIC:${rubric.rubricId}:${rubric.version}`, artifactType: "RUBRIC", subjectId: rubric.skillId, payload: rubric, createdAt: rubric.createdAt }); await this.artifacts.append({ artifactId: `EVALUATION:${evaluation.evaluationId}`, artifactType: "EVALUATION", subjectId: evaluation.skillId, payload: evaluation, createdAt: evaluation.createdAt });
    return this.transition(evaluation.evaluationId, null, "CREATED", evaluation.evaluator.actor, evaluation.createdAt, workspaceId, correlationId);
  }
  async transition(evaluationId: string, previousState: EvaluationLifecycleState | null, nextState: EvaluationLifecycleState, actor: Evaluation["evaluator"]["actor"], occurredAt: string, workspaceId: string, correlationId: string): Promise<EvaluationLifecycleEvent> {
    new EvaluationLifecycleService().transition(previousState, nextState); const event: EvaluationLifecycleEvent = { evaluationId, previousState, nextState, occurredAt, actor }; await this.artifacts.append({ artifactId: `EVALUATION_LIFECYCLE:${evaluationId}:${nextState}`, artifactType: "LIFECYCLE", subjectId: evaluationId, payload: event, createdAt: occurredAt }); if (this.audit) await this.audit.append({ eventId: `audit:evaluation-lifecycle:${evaluationId}:${nextState}`, eventType: nextState === "RUNNING" ? "SKILL_EVALUATION_STARTED" : nextState === "COMPLETED" ? "SKILL_EVALUATION_COMPLETED" : "SKILL_EVALUATION_VALIDATED", workspaceId, occurredAt, actor, correlationId, schemaVersion: "10.0", references: {}, payload: { evaluationId, previousState, nextState, durableKnowledgeEffect: "NONE", executionPermissionGranted: false } }); return event;
  }
}
