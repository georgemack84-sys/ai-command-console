import { z } from "zod";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { createBrief, deleteBrief, listBriefs, updateBrief } from "@/src/server/services/research-service";
import { executeResearchAction } from "@/src/server/services/research-action-service";
import { trackEvent } from "@/src/server/observability/analytics";

const createBriefSchema = z.object({
  title: z.string().min(1),
  question: z.string().min(1),
  status: z.enum(["draft", "queued", "in_progress", "in_review", "complete"]).default("draft"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  assignedAgent: z.string().min(1).default("researcher"),
  tags: z.array(z.string()).default([]),
  summary: z.string().default("New research brief created from the desk."),
  queueBrief: z.boolean().optional(),
});

const patchBriefSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  question: z.string().optional(),
  status: z.enum(["draft", "queued", "in_progress", "in_review", "complete"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  assignedAgent: z.string().optional(),
  tags: z.array(z.string()).optional(),
  summary: z.string().optional(),
  ownerId: z.string().nullable().optional(),
  routeToQueue: z.boolean().optional(),
});

const deleteBriefSchema = z.object({
  briefId: z.string().min(1),
});

async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new AppError(401, "unauthorized", "Authentication required.");
  }
  return user;
}

export async function GET() {
  try {
    const user = await requireUser();
    return apiSuccess({ briefs: await listBriefs(user.workspaceId) });
  } catch (error) {
    return apiError(error, "Unable to load briefs.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = createBriefSchema.parse(await request.json());
    const brief = await createBrief({
      workspaceId: user.workspaceId,
      ownerId: user.id,
      title: body.title.trim(),
      question: body.question.trim(),
      status: body.queueBrief ? "queued" : body.status,
      priority: body.priority,
      assignedAgent: body.assignedAgent.trim(),
      tags: body.tags.map((tag) => tag.trim()).filter(Boolean),
      summary: body.summary.trim(),
      linkedTaskId: null,
    });
    trackEvent({
      event: "research_brief_created",
      actorId: user.id,
      workspaceId: user.workspaceId,
      properties: { briefId: brief.id, priority: brief.priority },
    });
    return apiSuccess({ briefs: await listBriefs(user.workspaceId), brief }, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to create brief.");
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = patchBriefSchema.parse(await request.json());
    if (body.routeToQueue) {
      await executeResearchAction(
        {
          action: "brief:route",
          payload: {
            briefId: body.id,
          },
        },
        user,
      );
      return apiSuccess({ briefs: await listBriefs(user.workspaceId) });
    }

    await updateBrief({
      workspaceId: user.workspaceId,
      briefId: body.id,
      actorId: user.id,
      actorRole: user.role,
      patch: {
        ...(body.title ? { title: body.title.trim() } : {}),
        ...(body.question ? { question: body.question.trim() } : {}),
        ...(body.status ? { status: body.status } : {}),
        ...(body.priority ? { priority: body.priority } : {}),
        ...(body.assignedAgent ? { assignedAgent: body.assignedAgent.trim() } : {}),
        ...(body.tags ? { tags: body.tags.map((tag) => tag.trim()).filter(Boolean) } : {}),
        ...(body.summary ? { summary: body.summary.trim() } : {}),
        ...(user.role === "admin" ? { ownerId: body.ownerId ?? undefined } : {}),
      },
    });
    return apiSuccess({ briefs: await listBriefs(user.workspaceId) });
  } catch (error) {
    return apiError(error, "Unable to update brief.");
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const body = deleteBriefSchema.parse(await request.json());
    await deleteBrief(user.workspaceId, body.briefId, user.id, user.role);
    return apiSuccess({ briefs: await listBriefs(user.workspaceId) });
  } catch (error) {
    return apiError(error, "Unable to delete brief.");
  }
}
