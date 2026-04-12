import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { AppError } from "@/src/server/api/errors";
import { prisma } from "@/src/server/db/prisma";
import { createReport, updateReport } from "@/src/server/services/research-service";
import type { SessionUser } from "@/src/lib/types";

const researchActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("brief:route"),
    payload: z.object({ briefId: z.string().min(1) }),
  }),
  z.object({
    action: z.literal("review:create"),
    payload: z.object({ taskId: z.string().min(1) }),
  }),
  z.object({
    action: z.literal("review:followup"),
    payload: z.object({
      taskId: z.string().min(1),
      agentName: z.string().min(1),
      description: z.string().min(1),
    }),
  }),
  z.object({
    action: z.literal("report:create"),
    payload: z.object({
      briefId: z.string().min(1),
      title: z.string().min(1),
      format: z.enum(["memo", "briefing", "comparison", "outline"]),
      excerpt: z.string().min(1),
      keyFindings: z.array(z.string().min(1)),
    }),
  }),
  z.object({
    action: z.literal("report:publish"),
    payload: z.object({ reportId: z.string().min(1) }),
  }),
]);

type ResearchActor = Pick<SessionUser, "id" | "workspaceId" | "name" | "email" | "role">;

async function getWorkspaceBrief(briefId: string, actor: ResearchActor) {
  const brief = await prisma.researchBrief.findFirst({
    where: {
      id: briefId,
      workspaceId: actor.workspaceId,
    },
  });

  if (!brief) {
    throw new AppError(404, "brief_not_found", "Brief not found.");
  }

  if (brief.ownerId && brief.ownerId !== actor.id && actor.role !== "admin") {
    throw new AppError(403, "brief_forbidden", "Only the owner or an admin can update this brief.");
  }

  return brief;
}

async function getBriefByLinkedTask(taskId: string, actor: ResearchActor) {
  const brief = await prisma.researchBrief.findFirst({
    where: {
      linkedTaskId: taskId,
      workspaceId: actor.workspaceId,
    },
  });

  if (!brief) {
    throw new AppError(404, "brief_task_not_found", "No brief is linked to that task.");
  }

  if (brief.ownerId && brief.ownerId !== actor.id && actor.role !== "admin") {
    throw new AppError(403, "brief_forbidden", "Only the owner or an admin can update this brief.");
  }

  return brief;
}

async function recordResearchActivity(input: {
  workspaceId: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.activityEvent.create({
    data: {
      workspaceId: input.workspaceId,
      userId: input.userId,
      type: input.type,
      title: input.title,
      description: input.description,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function executeResearchAction(input: unknown, actor: ResearchActor) {
  const parsed = researchActionSchema.parse(input);

  if (parsed.action === "brief:route") {
    const brief = await getWorkspaceBrief(parsed.payload.briefId, actor);
    const taskId = brief.linkedTaskId || `task_${randomUUID().replace(/-/g, "").slice(0, 10)}`;

    await prisma.researchBrief.update({
      where: { id: brief.id },
      data: {
        status: "queued",
        linkedTaskId: taskId,
        summary: `Brief routed to ${brief.assignedAgent} and queued for research follow-through.`,
      },
    });

    await recordResearchActivity({
      workspaceId: actor.workspaceId,
      userId: actor.id,
      type: "research.brief.routed",
      title: "Brief routed",
      description: `Routed brief ${brief.id} to ${brief.assignedAgent} as task ${taskId}.`,
      metadata: {
        briefId: brief.id,
        taskId,
        agentName: brief.assignedAgent,
      },
    });

    return {
      action: parsed.action,
      output: `Queued brief "${brief.title}" as ${taskId}.`,
    };
  }

  if (parsed.action === "review:create") {
    const brief = await getBriefByLinkedTask(parsed.payload.taskId, actor);

    await prisma.researchBrief.update({
      where: { id: brief.id },
      data: {
        status: "in_review",
        summary: `Review opened for linked task ${parsed.payload.taskId}.`,
      },
    });

    await recordResearchActivity({
      workspaceId: actor.workspaceId,
      userId: actor.id,
      type: "research.review.created",
      title: "Review created",
      description: `Opened review for brief ${brief.id} on task ${parsed.payload.taskId}.`,
      metadata: {
        briefId: brief.id,
        taskId: parsed.payload.taskId,
      },
    });

    return {
      action: parsed.action,
      output: `Created review for task ${parsed.payload.taskId}.`,
    };
  }

  if (parsed.action === "review:followup") {
    const brief = await getBriefByLinkedTask(parsed.payload.taskId, actor);
    const followupTaskId = `task_${randomUUID().replace(/-/g, "").slice(0, 10)}`;

    await prisma.researchBrief.update({
      where: { id: brief.id },
      data: {
        status: "in_progress",
        assignedAgent: parsed.payload.agentName,
        summary: `Follow-up assigned to ${parsed.payload.agentName}: ${parsed.payload.description}`,
      },
    });

    await recordResearchActivity({
      workspaceId: actor.workspaceId,
      userId: actor.id,
      type: "research.review.followup_created",
      title: "Review follow-up created",
      description: `Created follow-up ${followupTaskId} for brief ${brief.id}: ${parsed.payload.description}`,
      metadata: {
        briefId: brief.id,
        taskId: parsed.payload.taskId,
        followupTaskId,
        agentName: parsed.payload.agentName,
        description: parsed.payload.description,
      },
    });

    return {
      action: parsed.action,
      output: `Created follow-up ${followupTaskId} for ${parsed.payload.agentName}.`,
    };
  }

  if (parsed.action === "report:create") {
    const brief = await getWorkspaceBrief(parsed.payload.briefId, actor);
    const report = await createReport({
      workspaceId: actor.workspaceId,
      ownerId: actor.id,
      briefId: brief.id,
      title: parsed.payload.title,
      format: parsed.payload.format,
      status: "draft",
      excerpt: parsed.payload.excerpt,
      keyFindings: parsed.payload.keyFindings,
    });

    await recordResearchActivity({
      workspaceId: actor.workspaceId,
      userId: actor.id,
      type: "research.report.created",
      title: "Draft report created",
      description: `Created draft report ${report.id} for brief ${brief.id}.`,
      metadata: {
        briefId: brief.id,
        reportId: report.id,
        format: report.format,
        keyFindings: report.keyFindings,
      },
    });

    return {
      action: parsed.action,
      output: `Created draft report "${report.title}".`,
    };
  }

  const report = await prisma.researchReport.findFirst({
    where: {
      id: parsed.payload.reportId,
      workspaceId: actor.workspaceId,
    },
  });

  if (!report) {
    throw new AppError(404, "report_not_found", "Report not found.");
  }

  await updateReport({
    workspaceId: actor.workspaceId,
    reportId: report.id,
    actorId: actor.id,
    actorRole: actor.role,
    patch: { status: "published" },
  });

  await recordResearchActivity({
    workspaceId: actor.workspaceId,
    userId: actor.id,
    type: "research.report.published",
    title: "Report published",
    description: `Published report ${report.id} for brief ${report.briefId}.`,
    metadata: {
      briefId: report.briefId,
      reportId: report.id,
    },
  });

  return {
    action: parsed.action,
    output: `Published report "${report.title}".`,
  };
}
