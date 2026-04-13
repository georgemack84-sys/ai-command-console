import { z } from "zod";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { getResearchDeskPreferences, saveResearchDeskPreferences } from "@/src/server/services/preferences-service";
import { requireWorkspaceMember, requireWorkspaceViewer } from "@/src/server/auth/permissions";

const viewSchema = z.object({
  name: z.string(),
  filter: z.enum(["all", "blocked", "review", "publish", "complete"]),
  sort: z.enum(["urgency", "priority", "recent"]),
  freshnessHours: z.number().positive(),
});

const scheduleSchema = z.object({
  id: z.string(),
  viewName: z.string(),
  cadence: z.enum(["weekday-morning", "daily-brief", "weekly-review"]),
  destination: z.enum(["report-draft", "clipboard-memo"]),
  lastRunAt: z.string().nullable().optional(),
});

const bodySchema = z.object({
  views: z.array(viewSchema).default([]),
  schedules: z.array(scheduleSchema).default([]),
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
    await requireWorkspaceViewer({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const preferences = await getResearchDeskPreferences(user.workspaceId, user.id);
    return apiSuccess(preferences);
  } catch (error) {
    return apiError(error, "Unable to load research desk preferences.");
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const body = bodySchema.parse(await request.json());
    const preferences = await saveResearchDeskPreferences(user.workspaceId, user.id, body);
    return apiSuccess(preferences);
  } catch (error) {
    return apiError(error, "Unable to save research desk preferences.");
  }
}
