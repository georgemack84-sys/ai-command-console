import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";
import type { LearningObjective, SocraticAnswerExtraction, SocraticArtifactStore, SocraticCandidateKnowledgeSubmission, SocraticCorrectionReplan, SocraticHumanAnswer, SocraticHypothesis, SocraticHypothesisState, SocraticHumanEffort, SocraticKnowledgeGap, SocraticKnowledgeMap, SocraticKnowledgeMapNode, SocraticKnowledgeObservation, SocraticKnowledgeSource, SocraticPrediction, SocraticPredictionReview, SocraticQuestionCandidate, SocraticQuestionType, SocraticSaturationDecision, SocraticSelectedQuestion, SocraticSession, SocraticTeachBackHandoff, SocraticWorkingModelUpdate } from "../../types/learning-constitution/socraticMentor";

const bounded = (value: number) => Math.max(0, Math.min(1, value));
const effortCost: Readonly<Record<SocraticHumanEffort, number>> = { VERY_LOW: 0.1, LOW: 0.25, MODERATE: 0.45, HIGH: 0.7, VERY_HIGH: 0.9 };
const leading = (question: string) => /^(would you agree|don't you think|isn't it true|surely)/i.test(question.trim());
/** Retrieves prior evidence before any question is generated; it deliberately has no durable-registry writer. */
export class SocraticKnowledgeRetrievalService {
  constructor(private readonly sources: readonly SocraticKnowledgeSource[]) {}
  async retrieve(objective: LearningObjective): Promise<readonly SocraticKnowledgeObservation[]> {
    const all = (await Promise.all(this.sources.map((source) => source.retrieve(objective)))).flat();
    return all.filter((item, index) => item.observationId.trim() && item.summary.trim() && Number.isFinite(item.confidence) && item.confidence >= 0 && item.confidence <= 1 && all.findIndex((other) => other.observationId === item.observationId) === index);
  }
}
/** Classifies explicit observations separately from weaker inferred evidence so the planner can target uncertainty. */
export class SocraticKnowledgeMapBuilder {
  build(input: Readonly<{ mapId: string; objective: LearningObjective; dimensions: readonly string[]; observations: readonly SocraticKnowledgeObservation[]; createdAt: string }>): SocraticKnowledgeMap {
    if (!input.mapId.trim() || !input.dimensions.length || input.dimensions.some((dimension) => !dimension.trim())) throw new Error("a knowledge map requires named dimensions");
    const words = (value: string) => value.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2);
    const nodes: SocraticKnowledgeMapNode[] = input.dimensions.map((label, index) => {
      const matches = input.observations.filter((observation) => words(label).some((word) => observation.summary.toLowerCase().includes(word)));
      const confidence = matches.length ? bounded(matches.reduce((total, observation) => total + observation.confidence, 0) / matches.length) : 0;
      const inferred = matches.length > 0 && matches.every((observation) => observation.sourceType === "DECISION" || observation.sourceType === "EXAMPLE");
      const state = !matches.length ? "UNKNOWN" : inferred ? "INFERRED" : confidence >= 0.75 ? "KNOWN" : confidence >= 0.4 ? "PARTIALLY_KNOWN" : "AMBIGUOUS";
      return { nodeId: `${input.mapId}:node:${index + 1}`, label, state, confidence, observationIds: matches.map((observation) => observation.observationId), rationale: matches.length ? `Classified from ${matches.length} prior observation(s).` : "No relevant prior observation." };
    });
    return { mapId: input.mapId, objectiveId: input.objective.objectiveId, nodes, sourceObservationIds: input.observations.map((observation) => observation.observationId), createdAt: input.createdAt, workingModelOnly: true };
  }
}
/** Converts an explicit knowledge map into ranked gaps. Higher priority means more useful uncertainty to resolve. */
export class SocraticUncertaintyService {
  identifyGaps(input: Readonly<{ sessionId: string; map: SocraticKnowledgeMap; objectiveRelevanceByNodeId: Readonly<Record<string, number>>; createdAt: string }>): readonly SocraticKnowledgeGap[] {
    const unresolved = input.map.nodes.filter((node): node is SocraticKnowledgeMapNode & { state: SocraticKnowledgeGap["state"] } => node.state !== "KNOWN");
    return unresolved.map((node): SocraticKnowledgeGap => {
      const relevance = input.objectiveRelevanceByNodeId[node.nodeId] ?? 0.5;
      if (!Number.isFinite(relevance) || relevance < 0 || relevance > 1) throw new Error("objective relevance must be between zero and one");
      const uncertainty = node.state === "CONFLICTING" ? 1 : node.state === "UNKNOWN" ? 1 : bounded(1 - node.confidence);
      return { gapId: `GAP:${input.sessionId}:${node.nodeId}`, sessionId: input.sessionId, nodeId: node.nodeId, state: node.state, uncertainty, objectiveRelevance: relevance, priority: bounded(uncertainty * relevance), rationale: `${node.state} knowledge requires working-model resolution.`, observationIds: node.observationIds, createdAt: input.createdAt, workingModelOnly: true };
    }).sort((left, right) => right.priority - left.priority || left.nodeId.localeCompare(right.nodeId));
  }
}
const hypothesisTransitions: Readonly<Record<SocraticHypothesisState, readonly SocraticHypothesisState[]>> = { PROPOSED: ["SUPPORTED", "WEAKENED", "CONTRADICTED", "REJECTED", "UNRESOLVED"], SUPPORTED: ["STRONGLY_SUPPORTED", "WEAKENED", "CONTRADICTED", "SUPERSEDED", "REJECTED"], STRONGLY_SUPPORTED: ["VALIDATED", "WEAKENED", "CONTRADICTED", "SUPERSEDED"], VALIDATED: ["SUPERSEDED"], WEAKENED: ["SUPPORTED", "CONTRADICTED", "REJECTED", "UNRESOLVED"], CONTRADICTED: ["REJECTED", "SUPERSEDED", "UNRESOLVED"], SUPERSEDED: [], REJECTED: [], UNRESOLVED: ["SUPPORTED", "WEAKENED", "CONTRADICTED", "REJECTED"] };
/** Preserves competing explanations as immutable revisions instead of silently replacing the model's belief. */
export class SocraticHypothesisService {
  constructor(private readonly artifacts: SocraticArtifactStore, private readonly audit?: LearningAuditLedger) {}
  async record(hypothesis: SocraticHypothesis, workspaceId: string, correlationId: string): Promise<SocraticHypothesis> {
    if (!hypothesis.hypothesisId.trim() || !hypothesis.sessionId.trim() || !hypothesis.nodeId.trim() || !hypothesis.claim.trim() || hypothesis.version !== 1 || !Number.isFinite(hypothesis.confidence) || hypothesis.confidence < 0 || hypothesis.confidence > 1 || !hypothesis.workingModelOnly) throw new Error("invalid initial Socratic hypothesis");
    await this.artifacts.append({ artifactId: `SOCRATIC_HYPOTHESIS:${hypothesis.hypothesisId}:1`, artifactType: "HYPOTHESIS", subjectId: hypothesis.sessionId, payload: hypothesis, createdAt: hypothesis.createdAt });
    if (this.audit) await this.audit.append({ eventId: `audit:socratic-hypothesis:${hypothesis.hypothesisId}:1`, eventType: "HYPOTHESIS_CREATED", workspaceId, occurredAt: hypothesis.createdAt, actor: hypothesis.createdBy, correlationId, schemaVersion: "10.0", references: {}, payload: { hypothesisId: hypothesis.hypothesisId, sessionId: hypothesis.sessionId, nodeId: hypothesis.nodeId, durableKnowledgeEffect: "NONE", executionPermissionGranted: false } });
    return hypothesis;
  }
  async revise(previous: SocraticHypothesis, next: SocraticHypothesis, workspaceId: string, correlationId: string): Promise<SocraticHypothesis> {
    if (previous.hypothesisId !== next.hypothesisId || previous.sessionId !== next.sessionId || next.version !== previous.version + 1 || !hypothesisTransitions[previous.state].includes(next.state)) throw new Error("invalid Socratic hypothesis transition");
    await this.artifacts.append({ artifactId: `SOCRATIC_HYPOTHESIS:${next.hypothesisId}:${next.version}`, artifactType: "HYPOTHESIS", subjectId: next.sessionId, payload: next, createdAt: next.createdAt });
    if (this.audit) await this.audit.append({ eventId: `audit:socratic-hypothesis:${next.hypothesisId}:${next.version}`, eventType: next.state === "REJECTED" ? "HYPOTHESIS_REJECTED" : "HYPOTHESIS_UPDATED", workspaceId, occurredAt: next.createdAt, actor: next.createdBy, correlationId, schemaVersion: "10.0", references: {}, payload: { hypothesisId: next.hypothesisId, previousState: previous.state, nextState: next.state, confidence: next.confidence, durableKnowledgeEffect: "NONE", executionPermissionGranted: false } });
    return next;
  }
}
/** Heuristic question utility prefers discriminating, relevant questions that impose little teacher effort and no leading premise. */
export class SocraticQuestionIntelligenceService {
  score(input: Readonly<{ candidateId: string; sessionId: string; question: string; questionType: SocraticQuestionType; targetNodeIds: readonly string[]; hypothesisIds: readonly string[]; uncertaintyReduction: number; objectiveRelevance: number; hypothesisSeparation: number; reuseValue: number; humanEffort: SocraticHumanEffort; leadingBiasRisk?: number; redundancyRisk?: number; createdAt: string }>): SocraticQuestionCandidate {
    const metrics = [input.uncertaintyReduction, input.objectiveRelevance, input.hypothesisSeparation, input.reuseValue, input.leadingBiasRisk ?? (leading(input.question) ? 1 : 0), input.redundancyRisk ?? 0];
    if (!input.candidateId.trim() || !input.sessionId.trim() || !input.question.trim() || !input.question.trim().endsWith("?") || input.question.split("?").length - 1 !== 1 || !input.targetNodeIds.length || metrics.some((metric) => !Number.isFinite(metric) || metric < 0 || metric > 1)) throw new Error("invalid Socratic question candidate");
    const leadingBiasRisk = input.leadingBiasRisk ?? (leading(input.question) ? 1 : 0); const redundancyRisk = input.redundancyRisk ?? 0;
    const raw = ((input.uncertaintyReduction * 0.32) + (input.objectiveRelevance * 0.28) + (input.hypothesisSeparation * 0.25) + (input.reuseValue * 0.15)) - (effortCost[input.humanEffort] * 0.2) - (leadingBiasRisk * 0.4) - (redundancyRisk * 0.3);
    return { ...input, leadingBiasRisk, redundancyRisk, informationGainScore: bounded(raw), workingModelOnly: true };
  }
  select(candidates: readonly SocraticQuestionCandidate[], askedQuestionCount: number, maximumQuestionBudget: number, actor: SocraticSelectedQuestion["selectedBy"], selectedAt: string): SocraticSelectedQuestion {
    if (askedQuestionCount >= maximumQuestionBudget) throw new Error("Socratic question budget exhausted");
    const eligible = candidates.filter((candidate) => candidate.leadingBiasRisk === 0 && candidate.redundancyRisk < 0.5).sort((left, right) => right.informationGainScore - left.informationGainScore || left.candidateId.localeCompare(right.candidateId)); const best = eligible[0];
    if (!best) throw new Error("no non-leading non-redundant Socratic question candidate");
    return { questionId: `SQ:${best.candidateId}`, sessionId: best.sessionId, candidateId: best.candidateId, question: best.question, questionType: best.questionType, selectedAt, selectedBy: actor, questionBudgetPosition: askedQuestionCount + 1, workingModelOnly: true };
  }
}
export class SocraticQuestionArtifactService {
  constructor(private readonly artifacts: SocraticArtifactStore, private readonly audit?: LearningAuditLedger) {}
  async recordAndSelect(input: Readonly<{ candidates: readonly SocraticQuestionCandidate[]; selected: SocraticSelectedQuestion; workspaceId: string; correlationId: string }>): Promise<SocraticSelectedQuestion> {
    if (!input.candidates.some((candidate) => candidate.candidateId === input.selected.candidateId && candidate.sessionId === input.selected.sessionId)) throw new Error("selected question must reference a generated candidate");
    for (const candidate of input.candidates) await this.artifacts.append({ artifactId: `SOCRATIC_QUESTION_CANDIDATE:${candidate.candidateId}`, artifactType: "QUESTION_CANDIDATE", subjectId: candidate.sessionId, payload: candidate, createdAt: candidate.createdAt });
    await this.artifacts.append({ artifactId: `SOCRATIC_QUESTION_SELECTED:${input.selected.questionId}`, artifactType: "QUESTION_SELECTED", subjectId: input.selected.sessionId, payload: input.selected, createdAt: input.selected.selectedAt });
    if (this.audit) { await this.audit.append({ eventId: `audit:socratic-candidates:${input.selected.sessionId}:${input.selected.questionBudgetPosition}`, eventType: "QUESTION_CANDIDATES_GENERATED", workspaceId: input.workspaceId, occurredAt: input.selected.selectedAt, actor: input.selected.selectedBy, correlationId: input.correlationId, schemaVersion: "10.0", references: {}, payload: { sessionId: input.selected.sessionId, count: input.candidates.length, durableKnowledgeEffect: "NONE", executionPermissionGranted: false } }); await this.audit.append({ eventId: `audit:socratic-question:${input.selected.questionId}`, eventType: "QUESTION_SELECTED", workspaceId: input.workspaceId, occurredAt: input.selected.selectedAt, actor: input.selected.selectedBy, correlationId: input.correlationId, schemaVersion: "10.0", references: {}, payload: { questionId: input.selected.questionId, candidateId: input.selected.candidateId, sessionId: input.selected.sessionId, durableKnowledgeEffect: "NONE", executionPermissionGranted: false } }); }
    return input.selected;
  }
}
/** Deterministic first-pass extraction labels claims as provisional; it never creates a registry candidate by itself. */
export class SocraticAnswerInterpretationService {
  interpret(answer: SocraticHumanAnswer): readonly SocraticAnswerExtraction[] {
    if (!answer.answer.trim() || answer.answeredBy.actorType !== "HUMAN") throw new Error("a Socratic answer requires non-empty human input");
    const normalized = answer.answer.trim(); const kinds: SocraticAnswerExtraction["kind"][] = ["EXPLICIT_CLAIM"];
    if (/\b(prefer|usually|tend to|favor|prioriti[sz]e)\b/i.test(normalized)) kinds.push("PREFERENCE");
    if (/\b(but|unless|except|only when|not .* just)\b/i.test(normalized)) kinds.push("EXCEPTION");
    if (/\b(no|incorrect|rather than)\b/i.test(normalized)) kinds.push("CORRECTION");
    if (/\b(not sure|depends|unclear)\b/i.test(normalized)) kinds.push("UNCERTAINTY");
    return kinds.map((kind, index) => ({ extractionId: `EX:${answer.answerId}:${index + 1}`, answerId: answer.answerId, kind, statement: normalized, confidence: kind === "EXPLICIT_CLAIM" ? 0.8 : 0.65, provisional: true }));
  }
}
/** Produces a new map revision after each answer; an answer can improve confidence but cannot make an inferred belief durable knowledge. */
export class SocraticWorkingModelService {
  update(input: Readonly<{ updateId: string; nextMapId: string; map: SocraticKnowledgeMap; answer: SocraticHumanAnswer; targetNodeIds: readonly string[]; createdAt: string }>): Readonly<{ map: SocraticKnowledgeMap; update: SocraticWorkingModelUpdate }> {
    if (!input.nextMapId.trim() || !input.targetNodeIds.length || input.targetNodeIds.some((id) => !input.map.nodes.some((node) => node.nodeId === id))) throw new Error("working-model update must target existing knowledge-map nodes");
    const before = input.map.nodes.length ? input.map.nodes.reduce((total, node) => total + (node.state === "KNOWN" ? 0 : 1 - node.confidence), 0) / input.map.nodes.length : 1;
    const nodes = input.map.nodes.map((node): SocraticKnowledgeMapNode => input.targetNodeIds.includes(node.nodeId) ? { ...node, state: node.state === "UNKNOWN" || node.state === "AMBIGUOUS" ? "PARTIALLY_KNOWN" : node.state, confidence: bounded(Math.max(node.confidence, 0.65)), observationIds: [...node.observationIds, input.answer.answerId], rationale: `Provisionally updated from human answer ${input.answer.answerId}.` } : node);
    const after = nodes.length ? nodes.reduce((total, node) => total + (node.state === "KNOWN" ? 0 : 1 - node.confidence), 0) / nodes.length : 1;
    const map: SocraticKnowledgeMap = { ...input.map, mapId: input.nextMapId, nodes, sourceObservationIds: [...input.map.sourceObservationIds, input.answer.answerId], createdAt: input.createdAt, workingModelOnly: true };
    return { map, update: { updateId: input.updateId, sessionId: input.answer.sessionId, previousMapId: input.map.mapId, nextMapId: map.mapId, answerId: input.answer.answerId, affectedNodeIds: input.targetNodeIds, uncertaintyBefore: before, uncertaintyAfter: after, createdAt: input.createdAt, workingModelOnly: true } };
  }
}
export class SocraticSaturationService {
  decide(input: Readonly<{ session: SocraticSession; gaps: readonly SocraticKnowledgeGap[]; marginalInformationGainThreshold: number }>): SocraticSaturationDecision {
    if (!Number.isFinite(input.marginalInformationGainThreshold) || input.marginalInformationGainThreshold < 0 || input.marginalInformationGainThreshold > 1) throw new Error("invalid Socratic saturation threshold"); const remaining = input.gaps[0]?.priority ?? 0; const asked = input.session.questionsAsked.length;
    const reason = asked >= input.session.questionBudget.maximum ? "QUESTION_BUDGET_EXHAUSTED" : remaining < input.marginalInformationGainThreshold ? "LOW_MARGINAL_INFORMATION_GAIN" : input.gaps.length === 0 ? "OBJECTIVE_COVERAGE_SUFFICIENT" : "MORE_QUESTIONS_REQUIRED";
    return { sessionId: input.session.sessionId, saturated: reason !== "MORE_QUESTIONS_REQUIRED", reason, remainingGapPriority: remaining, questionsAsked: asked, maximumQuestionBudget: input.session.questionBudget.maximum };
  }
}
export class SocraticAdaptiveArtifactService {
  constructor(private readonly artifacts: SocraticArtifactStore, private readonly audit?: LearningAuditLedger) {}
  async recordAnswerAndUpdate(input: Readonly<{ question: SocraticSelectedQuestion; answer: SocraticHumanAnswer; extractions: readonly SocraticAnswerExtraction[]; map: SocraticKnowledgeMap; update: SocraticWorkingModelUpdate; saturation: SocraticSaturationDecision; workspaceId: string; correlationId: string }>): Promise<void> {
    if (input.question.sessionId !== input.answer.sessionId || input.question.questionId !== input.answer.questionId || input.extractions.some((item) => item.answerId !== input.answer.answerId || !item.provisional) || input.update.answerId !== input.answer.answerId || input.update.nextMapId !== input.map.mapId) throw new Error("invalid adaptive Socratic update lineage");
    await this.artifacts.append({ artifactId: `SOCRATIC_HUMAN_ANSWER:${input.answer.answerId}`, artifactType: "HUMAN_ANSWER", subjectId: input.answer.sessionId, payload: input.answer, createdAt: input.answer.answeredAt }); for (const extraction of input.extractions) await this.artifacts.append({ artifactId: `SOCRATIC_EXTRACTION:${extraction.extractionId}`, artifactType: "ANSWER_EXTRACTION", subjectId: input.answer.sessionId, payload: extraction, createdAt: input.answer.answeredAt }); await this.artifacts.append({ artifactId: `SOCRATIC_KNOWLEDGE_MAP:${input.map.mapId}`, artifactType: "KNOWLEDGE_MAP", subjectId: input.map.objectiveId, payload: input.map, createdAt: input.map.createdAt }); await this.artifacts.append({ artifactId: `SOCRATIC_WORKING_MODEL_UPDATE:${input.update.updateId}`, artifactType: "WORKING_MODEL_UPDATE", subjectId: input.answer.sessionId, payload: input.update, createdAt: input.update.createdAt }); await this.artifacts.append({ artifactId: `SOCRATIC_SATURATION:${input.answer.sessionId}:${input.answer.answerId}`, artifactType: "SATURATION", subjectId: input.answer.sessionId, payload: input.saturation, createdAt: input.answer.answeredAt });
    if (this.audit) for (const [eventType, eventId, payload] of [["QUESTION_ASKED", `audit:socratic-question-asked:${input.question.questionId}`, { questionId: input.question.questionId }], ["HUMAN_ANSWER_RECEIVED", `audit:socratic-answer:${input.answer.answerId}`, { answerId: input.answer.answerId, questionId: input.question.questionId }], ["WORKING_MODEL_UPDATED", `audit:socratic-update:${input.update.updateId}`, { updateId: input.update.updateId, uncertaintyBefore: input.update.uncertaintyBefore, uncertaintyAfter: input.update.uncertaintyAfter }], ...(input.saturation.saturated ? [["KNOWLEDGE_SATURATION_REACHED", `audit:socratic-saturation:${input.answer.answerId}`, { reason: input.saturation.reason }]] as const : [])] as const) await this.audit.append({ eventId, eventType, workspaceId: input.workspaceId, occurredAt: input.answer.answeredAt, actor: input.answer.answeredBy, correlationId: input.correlationId, schemaVersion: "10.0", references: {}, payload: { ...payload, durableKnowledgeEffect: "NONE", executionPermissionGranted: false } });
  }
}
/** Builds a falsifiable prediction and a gate-bound Teach-Back request from a saturated working model. */
export class SocraticValidationService {
  createPrediction(prediction: SocraticPrediction): SocraticPrediction { if (!prediction.predictionId.trim() || !prediction.sessionId.trim() || !prediction.scenario.trim() || !prediction.predictedJudgment.trim() || !prediction.rationale.trim() || !prediction.boundaryStatement.trim() || !prediction.supportingHypothesisIds.length || !prediction.workingModelOnly) throw new Error("a Socratic prediction requires a falsifiable scenario, rationale, boundary, and hypotheses"); return prediction; }
  createTeachBackHandoff(input: Readonly<{ handoffId: string; sessionId: string; objective: LearningObjective; lesson: string; scope: string; sourceExamples: readonly string[]; actor: SocraticTeachBackHandoff["submittedBy"]; createdAt: string }>): SocraticTeachBackHandoff {
    if (!input.handoffId.trim() || !input.sessionId.trim() || !input.lesson.trim() || !input.scope.trim()) throw new Error("Socratic Teach-Back handoff requires a lesson and scope");
    return { handoffId: input.handoffId, sessionId: input.sessionId, teachBackRequest: { teachBackId: `TB:${input.handoffId}`, lessonId: `socratic-session:${input.sessionId}`, teachingEventId: `socratic-objective:${input.objective.objectiveId}`, candidateKnowledgeId: `socratic-candidate:${input.sessionId}`, lesson: input.lesson, scope: input.scope, sourceExamples: input.sourceExamples, generatedBy: input.actor }, submittedAt: input.createdAt, submittedBy: input.actor, durableLearningAuthorization: "GATE_REQUIRED", workingModelOnly: true };
  }
  correctionReplan(input: Readonly<{ replanId: string; sessionId: string; review: SocraticPredictionReview; affectedHypothesisIds: readonly string[]; createdAt: string }>): SocraticCorrectionReplan | null {
    if (input.review.outcome !== "CORRECTED") return null; if (!input.review.feedback.trim() || !input.affectedHypothesisIds.length) throw new Error("corrected prediction requires feedback and affected hypotheses"); return { replanId: input.replanId, sessionId: input.sessionId, predictionReviewId: input.review.reviewId, affectedHypothesisIds: input.affectedHypothesisIds, recommendedQuestionType: /scope|context|when|where/i.test(input.review.feedback) ? "BOUNDARY" : "COUNTERFACTUAL", reason: "Human correction requires a discriminating follow-up rather than restarting the interview.", createdAt: input.createdAt, workingModelOnly: true };
  }
}
export class SocraticValidationArtifactService {
  constructor(private readonly artifacts: SocraticArtifactStore, private readonly audit?: LearningAuditLedger) {}
  async record(input: Readonly<{ prediction: SocraticPrediction; review: SocraticPredictionReview | null; handoff: SocraticTeachBackHandoff | null; replan: SocraticCorrectionReplan | null; workspaceId: string; correlationId: string }>): Promise<void> {
    if (input.review && input.review.predictionId !== input.prediction.predictionId) throw new Error("prediction review lineage mismatch"); if (input.replan && (!input.review || input.replan.predictionReviewId !== input.review.reviewId)) throw new Error("correction replan lineage mismatch");
    await this.artifacts.append({ artifactId: `SOCRATIC_PREDICTION:${input.prediction.predictionId}`, artifactType: "PREDICTION", subjectId: input.prediction.sessionId, payload: input.prediction, createdAt: input.prediction.createdAt }); if (input.review) await this.artifacts.append({ artifactId: `SOCRATIC_PREDICTION_REVIEW:${input.review.reviewId}`, artifactType: "PREDICTION_REVIEW", subjectId: input.prediction.sessionId, payload: input.review, createdAt: input.review.reviewedAt }); if (input.handoff) await this.artifacts.append({ artifactId: `SOCRATIC_TEACH_BACK_HANDOFF:${input.handoff.handoffId}`, artifactType: "TEACH_BACK_HANDOFF", subjectId: input.prediction.sessionId, payload: input.handoff, createdAt: input.handoff.submittedAt }); if (input.replan) await this.artifacts.append({ artifactId: `SOCRATIC_CORRECTION_REPLAN:${input.replan.replanId}`, artifactType: "CORRECTION_REPLAN", subjectId: input.prediction.sessionId, payload: input.replan, createdAt: input.replan.createdAt });
    if (this.audit) { const events: Array<readonly [string, string, Record<string, unknown>, string]> = [["PREDICTIVE_VALIDATION_STARTED", `audit:socratic-prediction:${input.prediction.predictionId}`, { predictionId: input.prediction.predictionId }, input.prediction.createdAt]]; if (input.review) events.push([input.review.outcome === "CONFIRMED" ? "PREDICTION_CONFIRMED" : "PREDICTION_CORRECTED", `audit:socratic-prediction-review:${input.review.reviewId}`, { predictionId: input.review.predictionId, outcome: input.review.outcome }, input.review.reviewedAt]); if (input.handoff) events.push(["TEACH_BACK_REQUESTED", `audit:socratic-teach-back:${input.handoff.handoffId}`, { handoffId: input.handoff.handoffId, durableLearningAuthorization: "GATE_REQUIRED" }, input.handoff.submittedAt]); for (const [eventType, eventId, payload, occurredAt] of events) await this.audit.append({ eventId, eventType: eventType as import("../../types/learning-constitution/learningAuditLedger").LearningAuditEventType, workspaceId: input.workspaceId, occurredAt, actor: input.prediction.createdBy, correlationId: input.correlationId, schemaVersion: "10.0", references: {}, payload: { ...payload, durableKnowledgeEffect: "NONE", executionPermissionGranted: false } }); }
  }
}
/** The final Socratic boundary: submit a well-lineaged candidate package for the existing gate, never evaluate or promote it here. */
export class SocraticLearningPipelineHandoffService {
  constructor(private readonly artifacts: SocraticArtifactStore, private readonly audit?: LearningAuditLedger) {}
  async submit(input: Readonly<{ submission: SocraticCandidateKnowledgeSubmission; predictionReview: SocraticPredictionReview; handoff: SocraticTeachBackHandoff; workspaceId: string; correlationId: string }>): Promise<SocraticCandidateKnowledgeSubmission> {
    const { submission, predictionReview, handoff } = input;
    if (submission.status !== "GATE_SUBMISSION_REQUIRED" || !submission.claim.trim() || !submission.sourceAnswerIds.length || !submission.hypothesisIds.length || predictionReview.outcome !== "CONFIRMED" || submission.predictionReviewId !== predictionReview.reviewId || submission.teachBackHandoffId !== handoff.handoffId || handoff.durableLearningAuthorization !== "GATE_REQUIRED") throw new Error("Socratic candidate submission requires confirmed prediction, sources, hypotheses, Teach-Back, and gate review");
    await this.artifacts.append({ artifactId: `SOCRATIC_CANDIDATE_SUBMISSION:${submission.submissionId}`, artifactType: "CANDIDATE_SUBMISSION", subjectId: submission.sessionId, payload: submission, createdAt: submission.submittedAt });
    if (this.audit) await this.audit.append({ eventId: `audit:socratic-candidate:${submission.submissionId}`, eventType: "CANDIDATE_KNOWLEDGE_SUBMITTED", workspaceId: input.workspaceId, occurredAt: submission.submittedAt, actor: submission.submittedBy, correlationId: input.correlationId, schemaVersion: "10.0", references: { provenanceIds: submission.sourceAnswerIds }, payload: { submissionId: submission.submissionId, candidateId: submission.candidateId, sessionId: submission.sessionId, status: submission.status, durableKnowledgeEffect: "NONE", executionPermissionGranted: false } });
    return submission;
  }
}
/** Immutable session facts and meaningful audit transitions; no method writes to a durable learning registry. */
export class SocraticSessionService {
  constructor(private readonly artifacts: SocraticArtifactStore, private readonly audit?: LearningAuditLedger) {}
  async start(input: Readonly<{ objective: LearningObjective; knowledgeMap: SocraticKnowledgeMap; session: SocraticSession; workspaceId: string; correlationId: string }>): Promise<SocraticSession> {
    const { objective, knowledgeMap, session, workspaceId, correlationId } = input;
    if (!objective.objectiveId.trim() || !objective.objective.trim() || !objective.successCriteria.length || objective.teacher.actorType !== "HUMAN" || objective.status !== "ACTIVE") throw new Error("an active Socratic objective requires a human teacher and success criteria");
    if (knowledgeMap.objectiveId !== objective.objectiveId || !knowledgeMap.nodes.length || !knowledgeMap.workingModelOnly || session.objectiveId !== objective.objectiveId || session.knowledgeMapId !== knowledgeMap.mapId || session.status !== "ACTIVE" || session.questionBudget.preferred < 1 || session.questionBudget.maximum < session.questionBudget.preferred) throw new Error("invalid Socratic session foundation");
    await this.artifacts.append({ artifactId: `SOCRATIC_OBJECTIVE:${objective.objectiveId}`, artifactType: "OBJECTIVE", subjectId: objective.objectiveId, payload: objective, createdAt: objective.createdAt });
    await this.artifacts.append({ artifactId: `SOCRATIC_KNOWLEDGE_MAP:${knowledgeMap.mapId}`, artifactType: "KNOWLEDGE_MAP", subjectId: objective.objectiveId, payload: knowledgeMap, createdAt: knowledgeMap.createdAt });
    await this.artifacts.append({ artifactId: `SOCRATIC_SESSION:${session.sessionId}`, artifactType: "SESSION", subjectId: objective.objectiveId, payload: session, createdAt: session.createdAt });
    if (this.audit) for (const [eventType, eventId, payload] of [["LEARNING_OBJECTIVE_DEFINED", `audit:socratic-objective:${objective.objectiveId}`, { objectiveId: objective.objectiveId, scope: objective.scope }], ["KNOWLEDGE_MAP_CREATED", `audit:socratic-map:${knowledgeMap.mapId}`, { mapId: knowledgeMap.mapId, objectiveId: objective.objectiveId, nodeCount: knowledgeMap.nodes.length }], ["SOCRATIC_SESSION_STARTED", `audit:socratic-session:${session.sessionId}`, { sessionId: session.sessionId, objectiveId: objective.objectiveId, questionBudget: session.questionBudget }]] as const) await this.audit.append({ eventId, eventType, workspaceId, occurredAt: session.createdAt, actor: session.createdBy, correlationId, schemaVersion: "10.0", references: {}, payload: { ...payload, durableKnowledgeEffect: "NONE", executionPermissionGranted: false } });
    return session;
  }
}
