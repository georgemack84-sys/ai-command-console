import { z } from "zod";
import type { SessionUser } from "@/src/lib/types";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { trackEvent } from "@/src/server/observability/analytics";
import { executeResearchAction } from "@/src/server/services/research-action-service";
import { createBrief, deleteBrief, listBriefs, updateBrief } from "@/src/server/services/research-service";

const createBriefPayloadSchema = z.object({
  title: z.string().min(1),
  question: z.string().min(1),
  status: z.enum(["draft", "queued", "in_progress", "in_review", "complete"]).default("draft"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  assignedAgent: z.string().min(1).default("researcher"),
  tags: z.array(z.string()).default([]),
  summary: z.string().default("New research brief created from the desk."),
  queueBrief: z.boolean().optional(),
});

const updateBriefPayloadSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  question: z.string().optional(),
  status: z.enum(["draft", "queued", "in_progress", "in_review", "complete"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  assignedAgent: z.string().optional(),
  tags: z.array(z.string()).optional(),
  summary: z.string().optional(),
  ownerId: z.string().nullable().optional(),
});

const routeBriefPayloadSchema = z.object({ id: z.string().min(1) });
const deleteBriefPayloadSchema = z.object({ briefId: z.string().min(1) });

export const researchBriefMutationSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), payload: createBriefPayloadSchema }),
  z.object({ action: z.literal("update"), payload: updateBriefPayloadSchema }),
  z.object({ action: z.literal("route"), payload: routeBriefPayloadSchema }),
  z.object({ action: z.literal("delete"), payload: deleteBriefPayloadSchema }),
]);

type ResearchBriefActor = Pick<SessionUser, "id" | "workspaceId" | "name" | "email" | "role">;

export async function executeResearchBriefMutation(input: unknown, actor: ResearchBriefActor) {
  const mutation = researchBriefMutationSchema.parse(input);
  await requireWorkspaceMember({
    userId: actor.id,
    userRole: actor.role,
    workspaceId: actor.workspaceId,
  });

  if (mutation.action === "create") {
    const body = mutation.payload;
    const brief = await createBrief({
      workspaceId: actor.workspaceId,
      ownerId: actor.id,
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
      actorId: actor.id,
      workspaceId: actor.workspaceId,
      properties: { briefId: brief.id, priority: brief.priority },
    });
    return { data: { briefs: await listBriefs(actor.workspaceId), brief }, status: 201 };
  }

  if (mutation.action === "route") {
    await executeResearchAction(
      { action: "brief:route", payload: { briefId: mutation.payload.id } },
      actor,
    );
    return { data: { briefs: await listBriefs(actor.workspaceId) } };
  }

  if (mutation.action === "update") {
    const body = mutation.payload;
    await updateBrief({
      workspaceId: actor.workspaceId,
      briefId: body.id,
      actorId: actor.id,
      actorRole: actor.role,
      patch: {
        ...(body.title ? { title: body.title.trim() } : {}),
        ...(body.question ? { question: body.question.trim() } : {}),
        ...(body.status ? { status: body.status } : {}),
        ...(body.priority ? { priority: body.priority } : {}),
        ...(body.assignedAgent ? { assignedAgent: body.assignedAgent.trim() } : {}),
        ...(body.tags ? { tags: body.tags.map((tag) => tag.trim()).filter(Boolean) } : {}),
        ...(body.summary ? { summary: body.summary.trim() } : {}),
        ...(actor.role === "admin" ? { ownerId: body.ownerId ?? undefined } : {}),
      },
    });
    return { data: { briefs: await listBriefs(actor.workspaceId) } };
  }

  await deleteBrief(actor.workspaceId, mutation.payload.briefId, actor.id, actor.role);
  return { data: { briefs: await listBriefs(actor.workspaceId) } };
}
