import { z } from "zod";
import type { SessionUser } from "@/src/lib/types";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { trackEvent } from "@/src/server/observability/analytics";
import { createReport, deleteReport, listReports, updateReport } from "@/src/server/services/research-service";

const createReportPayloadSchema = z.object({
  briefId: z.string().min(1),
  title: z.string().min(1),
  format: z.enum(["memo", "briefing", "comparison", "outline"]).default("memo"),
  status: z.enum(["draft", "ready", "published"]).default("draft"),
  excerpt: z.string().default("Draft report created from the research desk."),
  keyFindings: z.array(z.string()).default([]),
});

const updateReportPayloadSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  briefId: z.string().optional(),
  format: z.enum(["memo", "briefing", "comparison", "outline"]).optional(),
  status: z.enum(["draft", "ready", "published"]).optional(),
  excerpt: z.string().optional(),
  keyFindings: z.array(z.string()).optional(),
  ownerId: z.string().nullable().optional(),
});

const deleteReportPayloadSchema = z.object({
  reportId: z.string().min(1),
});

export const researchReportMutationSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), payload: createReportPayloadSchema }),
  z.object({ action: z.literal("update"), payload: updateReportPayloadSchema }),
  z.object({ action: z.literal("delete"), payload: deleteReportPayloadSchema }),
]);

type ResearchReportActor = Pick<SessionUser, "id" | "workspaceId" | "name" | "email" | "role">;

export async function executeResearchReportMutation(input: unknown, actor: ResearchReportActor) {
  const mutation = researchReportMutationSchema.parse(input);
  await requireWorkspaceMember({
    userId: actor.id,
    userRole: actor.role,
    workspaceId: actor.workspaceId,
  });

  if (mutation.action === "create") {
    const body = mutation.payload;
    const report = await createReport({
      workspaceId: actor.workspaceId,
      ownerId: actor.id,
      briefId: body.briefId,
      title: body.title.trim(),
      format: body.format,
      status: body.status,
      excerpt: body.excerpt.trim(),
      keyFindings: body.keyFindings.map((item) => item.trim()).filter(Boolean),
    });
    trackEvent({
      event: "research_report_created",
      actorId: actor.id,
      workspaceId: actor.workspaceId,
      properties: { reportId: report.id, briefId: report.briefId, format: report.format },
    });
    return { data: { reports: await listReports(actor.workspaceId), report }, status: 201 };
  }

  if (mutation.action === "update") {
    const body = mutation.payload;
    await updateReport({
      workspaceId: actor.workspaceId,
      reportId: body.id,
      actorId: actor.id,
      actorRole: actor.role,
      patch: {
        ...(body.title ? { title: body.title.trim() } : {}),
        ...(body.briefId ? { briefId: body.briefId } : {}),
        ...(body.format ? { format: body.format } : {}),
        ...(body.status ? { status: body.status } : {}),
        ...(body.excerpt ? { excerpt: body.excerpt.trim() } : {}),
        ...(body.keyFindings
          ? { keyFindings: body.keyFindings.map((item) => item.trim()).filter(Boolean) }
          : {}),
        ...(actor.role === "admin" ? { ownerId: body.ownerId ?? undefined } : {}),
      },
    });
    return { data: { reports: await listReports(actor.workspaceId) } };
  }

  await deleteReport(actor.workspaceId, mutation.payload.reportId, actor.id, actor.role);
  return { data: { reports: await listReports(actor.workspaceId) } };
}
