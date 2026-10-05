import { prisma } from "@/src/server/db/prisma";
import { getNuruRabbitHole, rabbitHoles, type RabbitHoleAction } from "@/src/nuru/dashboard";
import type { NuruEditionCandidate } from "@/src/server/services/nuru-personal-edition-service";

async function ensureRabbitHoles() { await Promise.all(rabbitHoles.map(async (rabbitHole) => { await prisma.nuruRabbitHole.upsert({ where: { id: rabbitHole.id }, create: { id: rabbitHole.id, title: rabbitHole.title, subtitle: rabbitHole.subtitle, coverKey: rabbitHole.coverKey }, update: { title: rabbitHole.title, subtitle: rabbitHole.subtitle, coverKey: rabbitHole.coverKey } }); await Promise.all(rabbitHole.steps.map((step) => prisma.nuruRabbitHoleStep.upsert({ where: { id: step.id }, create: { id: step.id, rabbitHoleId: rabbitHole.id, position: step.position, title: step.title, description: step.description }, update: { rabbitHoleId: rabbitHole.id, position: step.position, title: step.title, description: step.description } }))); })); }
export async function getRabbitHoleProgress(userId: string, rabbitHoleId: string) { await ensureRabbitHoles(); const rabbitHole = getNuruRabbitHole(rabbitHoleId); if (!rabbitHole) return null; const progress = await prisma.nuruRabbitHoleProgress.findUnique({ where: { userId_rabbitHoleId: { userId, rabbitHoleId } } }); return { rabbitHole, completedSteps: progress?.completedSteps ?? [] }; }
export async function recordRabbitHoleAction(userId: string, rabbitHoleId: string, action: RabbitHoleAction) { const current = await getRabbitHoleProgress(userId, rabbitHoleId); if (!current || !current.rabbitHole.steps.some((step) => step.id === action.stepId)) return null; const completedSteps = current.completedSteps.includes(action.stepId) ? current.completedSteps.filter((id) => id !== action.stepId) : [...current.completedSteps, action.stepId]; await prisma.nuruRabbitHoleProgress.upsert({ where: { userId_rabbitHoleId: { userId, rabbitHoleId } }, create: { userId, rabbitHoleId, completedSteps }, update: { completedSteps } }); return { rabbitHole: current.rabbitHole, completedSteps }; }

export type NuruRabbitHoleNode = { candidate: NuruEditionCandidate; parentId: string | null; sharedTopics: string[] };

/** Returns a path node only when it is grounded in a currently shown edition root. */
export function findNuruRabbitHoleAccess(candidateId: string, roots: NuruEditionCandidate[], pool: NuruEditionCandidate[]) {
  for (const root of roots) {
    const node = buildNuruRabbitHole(root, pool.filter((candidate) => candidate.id !== root.id)).find((entry) => entry.candidate.id === candidateId);
    if (node) return { root, node };
  }
  return null;
}

/** Builds a bounded, deterministic path from source-backed shared topics. It never adds an ungrounded hop. */
export function buildNuruRabbitHole(root: NuruEditionCandidate, candidates: NuruEditionCandidate[], maximumNodes = 8): NuruRabbitHoleNode[] {
  const nodes: NuruRabbitHoleNode[] = [{ candidate: root, parentId: null, sharedTopics: [] }];
  const used = new Set([root.id]);
  while (nodes.length < maximumNodes) {
    const choices = candidates.filter((candidate) => !used.has(candidate.id)).flatMap((candidate) => nodes.map((node) => ({ candidate, parentId: node.candidate.id, sharedTopics: candidate.topics.filter((topic) => node.candidate.topics.some((parentTopic) => parentTopic.toLocaleLowerCase() === topic.toLocaleLowerCase())) }))).filter((choice) => choice.sharedTopics.length > 0).sort((left, right) => right.sharedTopics.length - left.sharedTopics.length || right.candidate.confidence - left.candidate.confidence || left.candidate.title.localeCompare(right.candidate.title));
    const next = choices[0];
    if (!next) break;
    nodes.push(next);
    used.add(next.candidate.id);
  }
  return nodes;
}
