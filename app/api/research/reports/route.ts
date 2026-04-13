import { z } from "zod";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { createReport, deleteReport, listReports, updateReport } from "@/src/server/services/research-service";
import { trackEvent } from "@/src/server/observability/analytics";

const createReportSchema = z.object({
  briefId: z.string().min(1),
  title: z.string().min(1),
  format: z.enum(["memo", "briefing", "comparison", "outline"]).default("memo"),
  status: z.enum(["draft", "ready", "published"]).default("draft"),
  excerpt: z.string().default("Draft report created from the research desk."),
  keyFindings: z.array(z.string()).default([]),
});

const patchReportSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  briefId: z.string().optional(),
  format: z.enum(["memo", "briefing", "comparison", "outline"]).optional(),
  status: z.enum(["draft", "ready", "published"]).optional(),
  excerpt: z.string().optional(),
  keyFindings: z.array(z.string()).optional(),
  ownerId: z.string().nullable().optional(),
});

const deleteReportSchema = z.object({
  reportId: z.string().min(1),
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
    return apiSuccess({ reports: await listReports(user.workspaceId) });
  } catch (error) {
    return apiError(error, "Unable to load reports.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = createReportSchema.parse(await request.json());
    const report = await createReport({
      workspaceId: user.workspaceId,
      ownerId: user.id,
      briefId: body.briefId,
      title: body.title.trim(),
      format: body.format,
      status: body.status,
      excerpt: body.excerpt.trim(),
      keyFindings: body.keyFindings.map((item) => item.trim()).filter(Boolean),
    });
    trackEvent({
      event: "research_report_created",
      actorId: user.id,
      workspaceId: user.workspaceId,
      properties: { reportId: report.id, briefId: report.briefId, format: report.format },
    });
    return apiSuccess({ reports: await listReports(user.workspaceId), report }, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to create report.");
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = patchReportSchema.parse(await request.json());
    await updateReport({
      workspaceId: user.workspaceId,
      reportId: body.id,
      actorId: user.id,
      actorRole: user.role,
      patch: {
        ...(body.title ? { title: body.title.trim() } : {}),
        ...(body.briefId ? { briefId: body.briefId } : {}),
        ...(body.format ? { format: body.format } : {}),
        ...(body.status ? { status: body.status } : {}),
        ...(body.excerpt ? { excerpt: body.excerpt.trim() } : {}),
        ...(body.keyFindings ? { keyFindings: body.keyFindings.map((item) => item.trim()).filter(Boolean) } : {}),
        ...(user.role === "admin" ? { ownerId: body.ownerId ?? undefined } : {}),
      },
    });
    return apiSuccess({ reports: await listReports(user.workspaceId) });
  } catch (error) {
    return apiError(error, "Unable to update report.");
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const body = deleteReportSchema.parse(await request.json());
    await deleteReport(user.workspaceId, body.reportId, user.id, user.role);
    return apiSuccess({ reports: await listReports(user.workspaceId) });
  } catch (error) {
    return apiError(error, "Unable to delete report.");
  }
}
