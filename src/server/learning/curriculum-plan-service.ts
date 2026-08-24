import { prisma } from "@/src/server/db/prisma";
import { buildCurriculumPlan } from "@/services/learning-constitution/curriculumPlanner";
import { ensureLinuxSkillGraphSeeded } from "./skill-graph-bootstrap";
import type { CurriculumPlannerInput, LearningHistoryEntry } from "@/types/learning-constitution/curriculumPlanner";
import { AppError } from "@/src/server/api/errors";

type PlanRequest = Pick<CurriculumPlannerInput, "goal" | "constraints">;
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

async function plannerInput(learnerId: string, request: PlanRequest): Promise<CurriculumPlannerInput> {
  const repository = await ensureLinuxSkillGraphSeeded();
  const [nodes, edges, states, profiles, priorEvents] = await Promise.all([
    repository.findAllNodes(), repository.findAllEdges(),
    prisma.skillLearnerState.findMany({ where: { learnerId } }),
    prisma.competencyProfile.findMany({ where: { learnerId }, orderBy: { calculatedAt: "desc" } }),
    prisma.learningPlanEvent.findMany({ where: { plan: { learnerId } }, include: { lesson: true }, orderBy: { createdAt: "desc" } }),
  ]);
  const assessmentResults = profiles.map((profile) => ({ id: profile.sessionId, skill_id: profile.skillId, completed_at: profile.calculatedAt.toISOString(), score: profile.score, competencies: { knowledge: profile.knowledge, application: profile.application, troubleshooting: profile.troubleshooting, retention: profile.retention, calibration: profile.calibration }, evidence_ids: [] }));
  const history: LearningHistoryEntry[] = priorEvents.flatMap((event) => event.lesson ? [{ skill_id: event.lesson.skillId, event: event.type as LearningHistoryEntry["event"], occurred_at: event.createdAt.toISOString(), lesson_id: event.lessonId ?? undefined }] : []);
  const evidence = (await Promise.all(nodes.map((node) => repository.findEvidenceBySkillId(node.id)))).flat();
  const evidenceBySkill = new Map<string, string[]>(); for (const item of evidence) evidenceBySkill.set(item.skill_id, [...(evidenceBySkill.get(item.skill_id) ?? []), item.id]);
  return { learner_id: learnerId, goal: request.goal, constraints: request.constraints, skill_graph: { nodes, edges, hierarchy: Object.fromEntries(nodes.map((node) => [node.id, edges.filter((edge) => edge.type === "CONTAINS" && edge.to_skill_id === node.id).map((edge) => edge.from_skill_id).sort()])), prerequisites: Object.fromEntries(nodes.map((node) => [node.id, edges.filter((edge) => edge.type === "PREREQUISITE" && edge.to_skill_id === node.id).map((edge) => edge.from_skill_id).sort()])) }, assessment_results: assessmentResults.map((item) => ({ ...item, evidence_ids: evidenceBySkill.get(item.skill_id) ?? [] })), learning_history: history, skill_states: states.map((state) => ({ skill_id: state.skillId, mastery: state.mastery, confidence: state.confidence, retention_score: state.retentionScore, last_evaluated: state.lastEvaluated?.toISOString() ?? null, evidence_ids: [...state.evidenceIds] })), evidence };
}

export async function generateLearningPlan(learnerId: string, request: PlanRequest, supersedePlanId?: string) {
  const plan = buildCurriculumPlan(await plannerInput(learnerId, request));
  return prisma.$transaction(async (transaction) => {
    if (supersedePlanId) {
      const existing = await transaction.learningPlan.findFirst({ where: { id: supersedePlanId, learnerId } });
      if (!existing) throw new AppError(404, "learning_plan_not_found", "Learning plan not found.");
      await transaction.learningPlan.update({ where: { id: supersedePlanId }, data: { supersededAt: new Date() } });
    } else await transaction.learningPlan.updateMany({ where: { learnerId, supersededAt: null }, data: { supersededAt: new Date() } });
    const saved = await transaction.learningPlan.create({ data: { learnerId, version: plan.version, status: plan.status, goal: json(request.goal), constraints: json(request.constraints), plan: json(plan), lessons: { create: plan.lessons.map((lesson) => ({ lessonKey: lesson.id, position: lesson.position, skillId: lesson.target_skill_id, lesson: json(lesson) })) }, events: { create: { type: "GENERATED" } } }, include: { lessons: true } });
    const savedLessonIds = new Map(saved.lessons.map((lesson) => [lesson.lessonKey, lesson.id]));
    return { id: saved.id, ...plan, lessons: plan.lessons.map((lesson) => ({ ...lesson, id: savedLessonIds.get(lesson.id) ?? lesson.id })) };
  });
}

export async function getCurrentLearningPlan(learnerId: string) {
  const result = await prisma.learningPlan.findFirst({ where: { learnerId, supersededAt: null }, orderBy: { createdAt: "desc" }, include: { lessons: true } });
  if (!result) return null;
  const plan = result.plan as { lessons?: Array<{ id: string }> };
  const savedLessonIds = new Map(result.lessons.map((lesson) => [lesson.lessonKey, lesson.id]));
  return { id: result.id, ...plan, lessons: plan.lessons?.map((lesson) => ({ ...lesson, id: savedLessonIds.get(lesson.id) ?? lesson.id })) ?? [] };
}

export async function recordLearningPlanEvent(learnerId: string, planId: string, lessonId: string, type: "STARTED" | "COMPLETED" | "SKIPPED") {
  const lesson = await prisma.learningPlanLesson.findFirst({ where: { id: lessonId, planId, plan: { learnerId } } });
  if (!lesson) throw new AppError(404, "learning_plan_lesson_not_found", "Learning plan lesson not found.");
  await prisma.learningPlanEvent.create({ data: { planId, lessonId, type } });
}

export async function replanLearningPlan(learnerId: string, planId: string, request: PlanRequest) { return generateLearningPlan(learnerId, request, planId); }

/** Completed assessments are the only automatic trigger for a new plan revision. */
export async function replanActiveLearningPlanAfterAssessment(learnerId: string) {
  const active = await prisma.learningPlan.findFirst({ where: { learnerId, supersededAt: null }, orderBy: { createdAt: "desc" } });
  if (!active) return null;
  return generateLearningPlan(learnerId, { goal: active.goal as PlanRequest["goal"], constraints: active.constraints as PlanRequest["constraints"] }, active.id);
}
