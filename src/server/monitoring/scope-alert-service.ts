import { createAlert } from "@/src/server/alerts/alert-service";
import { getScopeAlertRenotifyAfterMs } from "@/src/config/env";
import { prisma } from "@/src/server/db/prisma";

export const STALLED_TASK_AFTER_MS = 15 * 60 * 1000;
export const OVERDUE_PROMOTION_AFTER_MS = 24 * 60 * 60 * 1000;

type ScopeAlertCheckResult = {
  stalledTasks: number;
  overduePromotions: number;
  alertsCreated: number;
  alertsReactivated: number;
};

/**
 * Creates one durable alert per unresolved condition. The alert type contains the
 * subject id so repeated scans remain idempotent; archived alerts reopen only
 * after the configured re-notification window if the condition persists.
 */
export async function checkScopeOperationalAlerts(
  workspaceId: string,
  now = new Date(),
  renotifyAfterMs = getScopeAlertRenotifyAfterMs(),
): Promise<ScopeAlertCheckResult> {
  const stalledTaskThreshold = new Date(now.getTime() - STALLED_TASK_AFTER_MS);
  const overduePromotionThreshold = new Date(now.getTime() - OVERDUE_PROMOTION_AFTER_MS);

  const [queuedTasks, runningTasks, overduePromotions] = await Promise.all([
    prisma.agentTask.findMany({
      where: { workspaceId, status: "queued", createdAt: { lte: stalledTaskThreshold } },
      select: { id: true, type: true, createdAt: true },
    }),
    prisma.agentTask.findMany({
      where: { workspaceId, status: "running", updatedAt: { lte: stalledTaskThreshold } },
      select: { id: true, type: true, updatedAt: true },
    }),
    prisma.knowledgePromotion.findMany({
      where: { workspaceId, status: "pending", requestedAt: { lte: overduePromotionThreshold } },
      select: { id: true, requestedAt: true, sourceKnowledge: { select: { title: true } } },
    }),
  ]);

  const candidates = [
    ...queuedTasks.map((task) => ({
      type: `scope.task.stalled:${task.id}`,
      title: "Scoped task is stalled",
      message: `The queued ${task.type} task has not started since ${task.createdAt.toLocaleString()}.`,
      severity: "warning" as const,
    })),
    ...runningTasks.map((task) => ({
      type: `scope.task.stalled:${task.id}`,
      title: "Scoped task is stalled",
      message: `The running ${task.type} task has not updated since ${task.updatedAt.toLocaleString()}.`,
      severity: "warning" as const,
    })),
    ...overduePromotions.map((promotion) => ({
      type: `scope.promotion.overdue:${promotion.id}`,
      title: "Knowledge promotion needs review",
      message: `The promotion request for “${promotion.sourceKnowledge.title}” has been pending since ${promotion.requestedAt.toLocaleString()}.`,
      severity: "warning" as const,
    })),
  ];

  if (!candidates.length) {
    return { stalledTasks: 0, overduePromotions: 0, alertsCreated: 0, alertsReactivated: 0 };
  }

  const existing = await prisma.alert.findMany({
    where: {
      workspaceId,
      type: { in: candidates.map((candidate) => candidate.type) },
    },
    select: { id: true, type: true, status: true, updatedAt: true },
  });
  const existingByType = new Map<string, typeof existing>();
  for (const alert of existing) {
    existingByType.set(alert.type, [...(existingByType.get(alert.type) ?? []), alert]);
  }
  const newCandidates = candidates.filter((candidate) => !existingByType.has(candidate.type));
  const reactivationThreshold = now.getTime() - renotifyAfterMs;
  const reactivations = candidates.flatMap((candidate) => {
    const alerts = existingByType.get(candidate.type) ?? [];
    if (alerts.some((alert) => alert.status !== "archived")) return [];
    const latest = alerts.sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())[0];
    return latest && latest.updatedAt.getTime() <= reactivationThreshold ? [{ id: latest.id, ...candidate }] : [];
  });

  await Promise.all([
    ...newCandidates.map((candidate) => createAlert({ workspaceId, ...candidate })),
    ...reactivations.map((alert) => prisma.alert.update({
      where: { id: alert.id },
      data: { status: "unread", readAt: null, title: alert.title, message: alert.message, severity: alert.severity },
    })),
  ]);

  return {
    stalledTasks: queuedTasks.length + runningTasks.length,
    overduePromotions: overduePromotions.length,
    alertsCreated: newCandidates.length,
    alertsReactivated: reactivations.length,
  };
}
