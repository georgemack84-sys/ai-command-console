import { prisma } from "@/src/server/db/prisma";
import { AppError } from "@/src/server/api/errors";
import { buildAssessmentRecommendation, calculateCompetencyProfile, calculateDerivedSkillState, determineAdaptiveAssessmentNext, evaluateAssessmentResponse, generateAssessmentBlueprint, LINUX_SYSTEMD_ASSESSMENT_ITEM_BANK, SKILL_STATE_CALCULATION_V1 } from "@/services/learning-constitution";
import { ensureLinuxSkillGraphSeeded } from "./skill-graph-bootstrap";

type PublicAssessmentItem = Readonly<{ id: string; skill_id: string; evaluation_type: string; prompt: string; expected_response_format: string; difficulty: number; version: string; competency_dimensions: readonly string[]; content: unknown }>;
type ItemSource = Readonly<{ id: string; skillId: string; evaluationType: string; prompt: string; expectedResponseFormat: string; difficulty: number; version: string; competencyDimensions: readonly string[]; content: unknown }>;
type SessionSource = Readonly<{ id: string; targetSkillIds: readonly string[]; state: string; blueprintVersion: string; startedAt: Date; completedAt: Date | null }>;
type BlueprintPlan = Readonly<{ evaluation_type: string; skill_id: string }>;
type SelectableItem = Readonly<{ id: string; evaluationType: string; skillId: string }>;

export const toLearnerAssessmentItem = (item: ItemSource): PublicAssessmentItem => ({ id: item.id, skill_id: item.skillId, evaluation_type: item.evaluationType, prompt: item.prompt, expected_response_format: item.expectedResponseFormat, difficulty: item.difficulty, version: item.version, competency_dimensions: item.competencyDimensions, content: item.content });
export const toLearnerAssessmentSession = (session: SessionSource) => ({ id: session.id, target_skill_ids: session.targetSkillIds, state: session.state, blueprint_version: session.blueprintVersion, started_at: session.startedAt.toISOString(), ...(session.completedAt ? { completed_at: session.completedAt.toISOString() } : {}) });

const json = (value: unknown) => JSON.parse(JSON.stringify(value));
const stableIndex = (seed: string, length: number): number => [...seed].reduce((hash, character) => ((hash * 31) + character.charCodeAt(0)) >>> 0, 7) % length;
const evaluationScore = (value: unknown): number | null => value && typeof value === "object" && "score" in value && typeof value.score === "number" ? value.score : null;
const adaptiveItems = (items: readonly { item: { id: string; skillId: string; evaluationType: string; competencyDimensions: string[] }; position: number }[]) => items.map(({ item, position }) => ({ id: item.id, position, skill_id: item.skillId, evaluation_type: item.evaluationType as Parameters<typeof determineAdaptiveAssessmentNext>[0][number]["evaluation_type"], competency_dimensions: item.competencyDimensions as Parameters<typeof determineAdaptiveAssessmentNext>[0][number]["competency_dimensions"] }));

/** Selects one equivalent authored item per immutable blueprint position without changing its coverage. */
export const selectAssessmentSessionItems = (sessionId: string, plan: readonly BlueprintPlan[], candidates: readonly SelectableItem[]) => plan.map((entry, position) => {
  const matches = candidates.filter((item) => item.evaluationType === entry.evaluation_type && item.skillId === entry.skill_id).sort((left, right) => left.id.localeCompare(right.id));
  if (!matches.length) throw new AppError(422, "assessment_item_coverage_missing", `No authored item satisfies ${entry.evaluation_type} coverage for ${entry.skill_id}.`);
  return { itemId: matches[stableIndex(`${sessionId}:${position}:${entry.evaluation_type}:${entry.skill_id}`, matches.length)].id, position };
});

export async function ensureAssessmentDefinition(skillId: string) {
  const graphRepository = await ensureLinuxSkillGraphSeeded();
  const blueprint = generateAssessmentBlueprint(skillId, await graphRepository.findAllNodes(), await graphRepository.findAllEdges());
  const planByTypeAndSkill = new Set(blueprint.item_plan.map((plan) => `${plan.evaluation_type}:${plan.skill_id}`));
  const items = blueprint.item_plan.map((plan) => {
    const authored = LINUX_SYSTEMD_ASSESSMENT_ITEM_BANK.find((item) => item.evaluation_type === plan.evaluation_type && item.skill_id === plan.skill_id);
    if (!authored) throw new AppError(422, "assessment_item_coverage_missing", `No authored item satisfies ${plan.evaluation_type} coverage for ${plan.skill_id}.`);
    return { ...authored, blueprint_id: blueprint.id };
  });
  if (new Set(items.map((item) => `${item.evaluation_type}:${item.skill_id}`)).size !== planByTypeAndSkill.size) throw new AppError(422, "assessment_item_coverage_missing", "The authored item bank does not satisfy blueprint coverage.");
  await prisma.$transaction(async (transaction) => {
    await transaction.assessmentBlueprint.upsert({ where: { skillId_version: { skillId: blueprint.skill_id, version: blueprint.version } }, update: { objectives: json(blueprint.objectives), assessedSkillIds: [...blueprint.assessed_skill_ids], targetCompetencies: [...blueprint.target_competencies], itemMix: json(blueprint.item_mix), itemPlan: json(blueprint.item_plan), rules: json(blueprint.rules) }, create: { id: blueprint.id, skillId: blueprint.skill_id, version: blueprint.version, objectives: json(blueprint.objectives), assessedSkillIds: [...blueprint.assessed_skill_ids], targetCompetencies: [...blueprint.target_competencies], itemMix: json(blueprint.item_mix), itemPlan: json(blueprint.item_plan), rules: json(blueprint.rules) } });
    for (const item of items) await transaction.assessmentItem.upsert({ where: { id: item.id }, update: { skillId: item.skill_id, blueprintId: item.blueprint_id, evaluationType: item.evaluation_type, prompt: item.prompt, expectedResponseFormat: item.expected_response_format, rubric: json(item.rubric), difficulty: item.difficulty, version: item.version, competencyDimensions: [...item.competency_dimensions], content: item.content ? json(item.content) : null }, create: { id: item.id, skillId: item.skill_id, blueprintId: item.blueprint_id, evaluationType: item.evaluation_type, prompt: item.prompt, expectedResponseFormat: item.expected_response_format, rubric: json(item.rubric), difficulty: item.difficulty, version: item.version, competencyDimensions: [...item.competency_dimensions], content: item.content ? json(item.content) : undefined } });
  });
  return blueprint;
}

export async function startOrResumeAssessment(learnerId: string, skillId: string) {
  const blueprint = await ensureAssessmentDefinition(skillId);
  const existing = await prisma.assessmentSession.findFirst({ where: { learnerId, blueprintId: blueprint.id, state: "IN_PROGRESS" }, orderBy: { startedAt: "desc" } });
  if (existing) return { session: existing, resumed: true };
  const session = await prisma.$transaction(async (transaction) => {
    const created = await transaction.assessmentSession.create({ data: { learnerId, blueprintId: blueprint.id, targetSkillIds: [...blueprint.assessed_skill_ids], state: "IN_PROGRESS", blueprintVersion: blueprint.version } });
    const candidates = await transaction.assessmentItem.findMany({ where: { blueprintId: blueprint.id }, select: { id: true, evaluationType: true, skillId: true } });
    await transaction.assessmentSessionItem.createMany({ data: selectAssessmentSessionItems(created.id, blueprint.item_plan, candidates).map((item) => ({ ...item, sessionId: created.id })) });
    return created;
  });
  return { session, resumed: false };
}

export async function getAssessmentSession(learnerId: string, sessionId: string) {
  const session = await prisma.assessmentSession.findFirst({ where: { id: sessionId, learnerId }, include: { responses: { orderBy: { submittedAt: "asc" } }, sessionItems: { include: { item: true }, orderBy: { position: "asc" } } } });
  if (!session) throw new AppError(404, "assessment_session_not_found", "Assessment session not found.");
  const decision = determineAdaptiveAssessmentNext(adaptiveItems(session.sessionItems), session.responses.map((response) => ({ item_id: response.itemId, score: evaluationScore(response.evaluationResult) })));
  const currentItems = decision.next_item_id ? session.sessionItems.filter(({ item }) => item.id === decision.next_item_id).map(({ item }) => toLearnerAssessmentItem(item)) : [];
  return { session: toLearnerAssessmentSession(session), items: currentItems, progress: decision, responses: session.responses.map((response) => ({ item_id: response.itemId, answer: response.answer, self_rated_confidence: response.selfRatedConfidence, submitted_at: response.submittedAt.toISOString() })) };
}

export async function submitAssessmentResponse(learnerId: string, sessionId: string, input: { itemId: string; answer: unknown; selfRatedConfidence?: number }) {
  const session = await prisma.assessmentSession.findFirst({ where: { id: sessionId, learnerId }, include: { responses: true, sessionItems: { include: { item: true }, orderBy: { position: "asc" } } } });
  if (!session) throw new AppError(404, "assessment_session_not_found", "Assessment session not found.");
  if (session.state !== "IN_PROGRESS") throw new AppError(409, "assessment_session_closed", "Responses can only be submitted to an in-progress assessment.");
  const decision = determineAdaptiveAssessmentNext(adaptiveItems(session.sessionItems), session.responses.map((response) => ({ item_id: response.itemId, score: evaluationScore(response.evaluationResult) })));
  if (decision.state !== "CONTINUE" || decision.next_item_id !== input.itemId) throw new AppError(409, "assessment_item_not_available", "This item is not the current adaptive assessment prompt.", { nextItemId: decision.next_item_id });
  const sessionItem = await prisma.assessmentSessionItem.findUnique({ where: { sessionId_itemId: { sessionId, itemId: input.itemId }, }, include: { item: true } });
  if (!sessionItem) throw new AppError(404, "assessment_item_not_found", "Assessment item is not part of this session.");
  const existing = await prisma.assessmentResponse.findUnique({ where: { sessionId_itemId: { sessionId, itemId: sessionItem.itemId } } });
  if (existing) throw new AppError(409, "assessment_response_exists", "This assessment item already has a recorded response.");
  const result = evaluateAssessmentResponse({ evaluation_type: sessionItem.item.evaluationType as Parameters<typeof evaluateAssessmentResponse>[0]["evaluation_type"], answer: input.answer, rubric: sessionItem.item.rubric as Record<string, unknown>, rubric_version: sessionItem.item.version });
  return prisma.assessmentResponse.create({ data: { sessionId, itemId: sessionItem.itemId, answer: json(input.answer), selfRatedConfidence: input.selfRatedConfidence, evaluationResult: json(result), feedback: result.rationale } });
}

export async function completeAssessmentSession(learnerId: string, sessionId: string) {
  const result = await prisma.$transaction(async (transaction) => {
    const session = await transaction.assessmentSession.findFirst({ where: { id: sessionId, learnerId }, include: { blueprint: { select: { skillId: true } }, responses: true, sessionItems: { include: { item: true }, orderBy: { position: "asc" } } } });
    if (!session) throw new AppError(404, "assessment_session_not_found", "Assessment session not found.");
    if (session.state !== "IN_PROGRESS") throw new AppError(409, "assessment_session_closed", "This assessment session is already closed.");
    const decision = determineAdaptiveAssessmentNext(adaptiveItems(session.sessionItems), session.responses.map((response) => ({ item_id: response.itemId, score: evaluationScore(response.evaluationResult) })));
    if (decision.state !== "READY_TO_COMPLETE") throw new AppError(422, "assessment_adaptive_followup_required", decision.reason, { nextItemId: decision.next_item_id });
    const responseByItemId = new Map(session.responses.map((response) => [response.itemId, response]));
    const evaluated = session.sessionItems.flatMap(({ item }) => {
      const response = responseByItemId.get(item.id);
      return response ? [{ item, response, result: evaluateAssessmentResponse({ evaluation_type: item.evaluationType as Parameters<typeof evaluateAssessmentResponse>[0]["evaluation_type"], answer: response.answer, rubric: item.rubric as Record<string, unknown>, rubric_version: item.version }) }] : [];
    });
    for (const entry of evaluated) await transaction.assessmentResponse.update({ where: { id: entry.response.id }, data: { evaluationResult: json(entry.result), feedback: entry.result.rationale } });
    const profile = calculateCompetencyProfile(evaluated.map((entry) => ({ score: entry.result.score, competency_dimensions: entry.item.competencyDimensions as Parameters<typeof calculateCompetencyProfile>[0][number]["competency_dimensions"], self_rated_confidence: entry.response.selfRatedConfidence })));
    const completedAt = new Date();
    await transaction.competencyProfile.upsert({ where: { sessionId_skillId: { sessionId: session.id, skillId: session.blueprint.skillId } }, update: { knowledge: profile.knowledge, application: profile.application, troubleshooting: profile.troubleshooting, retention: profile.retention, calibration: profile.calibration, score: profile.score, confidenceInterval: json(profile.confidence_interval), evidenceCount: profile.evidence_count, calculationVersion: "assessment-profile-v1", calculatedAt: completedAt }, create: { sessionId: session.id, learnerId, skillId: session.blueprint.skillId, knowledge: profile.knowledge, application: profile.application, troubleshooting: profile.troubleshooting, retention: profile.retention, calibration: profile.calibration, score: profile.score, confidenceInterval: json(profile.confidence_interval), evidenceCount: profile.evidence_count, calculationVersion: "assessment-profile-v1", calculatedAt: completedAt } });
    for (const entry of evaluated) await transaction.skillEvidence.upsert({ where: { id: `assessment-${session.id}-${entry.item.id}` }, update: {}, create: { id: `assessment-${session.id}-${entry.item.id}`, learnerId, skillId: entry.item.skillId, kind: "ASSESSMENT", occurredAt: completedAt, score: entry.result.score, outcome: entry.result.outcome, evaluator: "SYSTEM", sourceRef: session.id, notes: entry.result.rationale, rubricVersion: entry.result.rubric_version, assessmentSessionId: session.id, assessmentItemId: entry.item.id, evaluationType: entry.result.evaluation_type, competencyDimensions: [...entry.item.competencyDimensions] } });
    const recommendation = buildAssessmentRecommendation({ id: `assessment-recommendation-${session.id}`, session_id: session.id, learner_id: learnerId, target_skill_id: session.blueprint.skillId, profile, evaluated_items: evaluated.map((entry) => ({ skill_id: entry.item.skillId, score: entry.result.score })), now: completedAt });
    await transaction.assessmentRecommendation.upsert({ where: { sessionId: session.id }, update: { instructionalStartingPoint: recommendation.instructional_starting_point, priorityGaps: json(recommendation.priority_gaps), retestAt: recommendation.retest_at ? new Date(recommendation.retest_at) : null }, create: { id: recommendation.id, sessionId: session.id, learnerId, instructionalStartingPoint: recommendation.instructional_starting_point, priorityGaps: json(recommendation.priority_gaps), retestAt: recommendation.retest_at ? new Date(recommendation.retest_at) : undefined } });
    return transaction.assessmentSession.update({ where: { id: session.id }, data: { state: "COMPLETED", completedAt } });
  });
  await refreshDerivedSkillStates(learnerId, result.targetSkillIds);
  await (await import("./curriculum-plan-service")).replanActiveLearningPlanAfterAssessment(learnerId);
  return result;
}

async function refreshDerivedSkillStates(learnerId: string, skillIds: readonly string[]) {
  const repository = await ensureLinuxSkillGraphSeeded();
  for (const skillId of new Set(skillIds)) {
    const state = calculateDerivedSkillState(learnerId, skillId, await repository.findEvidenceBySkillId(skillId), { ...SKILL_STATE_CALCULATION_V1, asOf: new Date().toISOString() });
    await prisma.skillLearnerState.upsert({ where: { learnerId_skillId: { learnerId, skillId } }, update: { mastery: state.mastery, confidence: state.confidence, retentionScore: state.retention_score, lastEvaluated: state.last_evaluated ? new Date(state.last_evaluated) : null, displayState: state.display_state, calculationVersion: state.calculation_version, calculatedAt: new Date(state.calculated_at), evidenceIds: [...state.evidence_ids] }, create: { learnerId, skillId, mastery: state.mastery, confidence: state.confidence, retentionScore: state.retention_score, lastEvaluated: state.last_evaluated ? new Date(state.last_evaluated) : null, displayState: state.display_state, calculationVersion: state.calculation_version, calculatedAt: new Date(state.calculated_at), evidenceIds: [...state.evidence_ids] } });
  }
}

export async function getLatestCompetencyProfile(learnerId: string, skillId: string) {
  const profile = await prisma.competencyProfile.findFirst({ where: { learnerId, skillId }, orderBy: { calculatedAt: "desc" } });
  if (!profile) throw new AppError(404, "competency_profile_not_found", "No competency profile is available for this skill.");
  return { skill_id: profile.skillId, knowledge: profile.knowledge, application: profile.application, troubleshooting: profile.troubleshooting, retention: profile.retention, calibration: profile.calibration, score: profile.score, confidence_interval: profile.confidenceInterval, evidence_count: profile.evidenceCount, calculation_version: profile.calculationVersion, calculated_at: profile.calculatedAt.toISOString() };
}

export async function getAssessmentRecommendation(learnerId: string, sessionId: string) {
  const recommendation = await prisma.assessmentRecommendation.findFirst({ where: { sessionId, learnerId } });
  if (!recommendation) throw new AppError(404, "assessment_recommendation_not_found", "No assessment recommendation is available for this session.");
  return { instructional_starting_point: recommendation.instructionalStartingPoint, priority_gaps: recommendation.priorityGaps, ...(recommendation.retestAt ? { retest_at: recommendation.retestAt.toISOString() } : {}) };
}
