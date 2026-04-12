import { z } from "zod";
import { prisma } from "@/src/server/db/prisma";
import { AppError } from "@/src/server/api/errors";
import type { SessionUser } from "@/src/lib/types";
import { queueBackgroundJob } from "@/src/server/jobs/background-jobs";

const dashboardActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("alert:run-checks"),
    payload: z.object({}).default({}),
  }),
  z.object({
    action: z.literal("alert:acknowledge"),
    payload: z.object({
      alertId: z.string().min(1),
      owner: z.string().min(1),
    }),
  }),
  z.object({
    action: z.literal("workspace:generate-summary"),
    payload: z.object({
      workspaceId: z.string().min(1).optional(),
    }),
  }),
]);

type DashboardActor = Pick<SessionUser, "id" | "workspaceId" | "name" | "email" | "role">;

export async function executeDashboardAction(input: unknown, actor: DashboardActor) {
  const parsed = dashboardActionSchema.parse(input);

  if (parsed.action === "alert:run-checks") {
    const [highPriorityUpdates, degradedSources] = await Promise.all([
      prisma.monitoredUpdate.count({
        where: {
          workspaceId: actor.workspaceId,
          severity: { in: ["high", "critical"] },
          status: { not: "acknowledged" },
        },
      }),
      prisma.source.count({
        where: {
          workspaceId: actor.workspaceId,
          status: { in: ["degraded", "paused"] },
        },
      }),
    ]);

    await prisma.activityEvent.create({
      data: {
        workspaceId: actor.workspaceId,
        userId: actor.id,
        type: "dashboard.alerts.checked",
        title: "Alert checks completed",
        description: `Alert scan found ${highPriorityUpdates} active high-severity updates and ${degradedSources} degraded sources in workspace ${actor.workspaceId}.`,
        metadata: {
          highPriorityUpdates,
          degradedSources,
          checkedById: actor.id,
          checkedByName: actor.name || actor.email,
        },
      },
    });

    return {
      action: parsed.action,
      output: `Alert checks completed. ${highPriorityUpdates} active high-severity updates and ${degradedSources} degraded sources need attention.`,
    };
  }

  if (parsed.action === "workspace:generate-summary") {
    const workspaceId = parsed.payload.workspaceId || actor.workspaceId;
    if (workspaceId !== actor.workspaceId) {
      throw new AppError(403, "dashboard_workspace_forbidden", "You can only queue summary jobs for your current workspace.");
    }

    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId },
      select: { id: true, name: true },
    });

    if (!workspace) {
      throw new AppError(404, "dashboard_workspace_not_found", "Workspace not found.");
    }

    const job = queueBackgroundJob(
      "workspace:generate-summary",
      {
        workspaceId: workspace.id,
        view: {
          name: "Dashboard Summary",
          filter: "all",
          sort: "recent",
          freshnessHours: 72,
        },
      },
      { actorId: actor.id, actorName: actor.name },
    );

    await prisma.activityEvent.create({
      data: {
        workspaceId: workspace.id,
        userId: actor.id,
        type: "dashboard.workspace.summary.queued",
        title: "Workspace summary queued",
        description: `Queued a background summary refresh for ${workspace.name}.`,
        metadata: {
          jobId: job.id,
          queuedById: actor.id,
          queuedByName: actor.name || actor.email,
        },
      },
    });

    return {
      action: parsed.action,
      output: `Queued summary refresh for ${workspace.name} as job ${job.id}.`,
    };
  }

  const update = await prisma.monitoredUpdate.findFirst({
    where: {
      id: parsed.payload.alertId,
      workspaceId: actor.workspaceId,
    },
  });

  if (!update) {
    throw new AppError(404, "dashboard_alert_not_found", "Alert not found.");
  }

  await prisma.$transaction([
    prisma.monitoredUpdate.update({
      where: { id: update.id },
      data: { status: "acknowledged" },
    }),
    prisma.activityEvent.create({
      data: {
        workspaceId: actor.workspaceId,
        userId: actor.id,
        type: "dashboard.alert.acknowledged",
        title: "Alert acknowledged",
        description: `Acknowledged monitored update ${update.id} for workspace ${actor.workspaceId}.`,
        metadata: {
          updateId: update.id,
          owner: parsed.payload.owner,
          acknowledgedById: actor.id,
          acknowledgedByName: actor.name || actor.email,
        },
      },
    }),
  ]);

  return {
    action: parsed.action,
    output: `Acknowledged alert "${update.title}".`,
  };
}
