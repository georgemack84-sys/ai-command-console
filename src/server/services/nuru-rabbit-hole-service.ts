import { prisma } from "@/src/server/db/prisma";
import { getNuruRabbitHole, rabbitHoles, type RabbitHoleAction } from "@/src/nuru/dashboard";

async function ensureRabbitHoles() {
  await Promise.all(rabbitHoles.map(async (rabbitHole) => {
    await prisma.nuruRabbitHole.upsert({
      where: { id: rabbitHole.id },
      create: { id: rabbitHole.id, title: rabbitHole.title, subtitle: rabbitHole.subtitle, coverKey: rabbitHole.coverKey },
      update: { title: rabbitHole.title, subtitle: rabbitHole.subtitle, coverKey: rabbitHole.coverKey },
    });
    await Promise.all(rabbitHole.steps.map((step) => prisma.nuruRabbitHoleStep.upsert({
      where: { id: step.id },
      create: { id: step.id, rabbitHoleId: rabbitHole.id, position: step.position, title: step.title, description: step.description },
      update: { rabbitHoleId: rabbitHole.id, position: step.position, title: step.title, description: step.description },
    })));
  }));
}

export async function getRabbitHoleProgress(userId: string, rabbitHoleId: string) {
  await ensureRabbitHoles();
  const rabbitHole = getNuruRabbitHole(rabbitHoleId);
  if (!rabbitHole) return null;
  const progress = await prisma.nuruRabbitHoleProgress.findUnique({ where: { userId_rabbitHoleId: { userId, rabbitHoleId } } });
  return { rabbitHole, completedSteps: progress?.completedSteps ?? [] };
}

export async function recordRabbitHoleAction(userId: string, rabbitHoleId: string, action: RabbitHoleAction) {
  const current = await getRabbitHoleProgress(userId, rabbitHoleId);
  if (!current || !current.rabbitHole.steps.some((step) => step.id === action.stepId)) return null;
  const completedSteps = current.completedSteps.includes(action.stepId)
    ? current.completedSteps.filter((id) => id !== action.stepId)
    : [...current.completedSteps, action.stepId];
  await prisma.nuruRabbitHoleProgress.upsert({
    where: { userId_rabbitHoleId: { userId, rabbitHoleId } },
    create: { userId, rabbitHoleId, completedSteps },
    update: { completedSteps },
  });
  return { rabbitHole: current.rabbitHole, completedSteps };
}
