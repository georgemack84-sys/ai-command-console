import { prisma } from "@/src/server/db/prisma";
import { AppError } from "@/src/server/api/errors";

export type AlertCreateInput = {
  workspaceId: string;
  userId?: string | null;
  sourceId?: string | null;
  updateId?: string | null;
  insightId?: string | null;
  type: string;
  title: string;
  message: string;
  severity?: "info" | "warning" | "critical";
};

export async function listAlerts(workspaceId: string, userId?: string | null, limit = 20) {
  const where = userId ? { workspaceId, userId } : { workspaceId };
  return prisma.alert.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export async function createAlert(input: AlertCreateInput) {
  return prisma.alert.create({
    data: {
      workspaceId: input.workspaceId,
      userId: input.userId ?? null,
      sourceId: input.sourceId ?? null,
      updateId: input.updateId ?? null,
      insightId: input.insightId ?? null,
      type: input.type,
      title: input.title,
      message: input.message,
      severity: input.severity ?? "info",
      status: "unread",
    },
  });
}

export async function markAlertRead(alertId: string, userId: string, workspaceId: string) {
  const alert = await prisma.alert.findUnique({ where: { id: alertId } });
  if (!alert || alert.workspaceId !== workspaceId) {
    throw new AppError(404, "alert_not_found", "Alert not found.");
  }
  if (alert.userId && alert.userId !== userId) {
    throw new AppError(403, "alert_forbidden", "You do not have access to this alert.");
  }

  return prisma.alert.update({
    where: { id: alertId },
    data: {
      status: "read",
      readAt: new Date(),
    },
  });
}

export async function markAllAlertsRead(workspaceId: string, userId?: string | null) {
  const where = userId ? { workspaceId, userId } : { workspaceId };
  return prisma.alert.updateMany({
    where: {
      ...where,
      status: "unread",
    },
    data: {
      status: "read",
      readAt: new Date(),
    },
  });
}
