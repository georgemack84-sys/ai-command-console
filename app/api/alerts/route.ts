import { z } from "zod";
import { getSessionUser } from "@/src/lib/auth";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { AppError } from "@/src/server/api/errors";
import { listAlerts, markAlertRead, markAllAlertsRead } from "@/src/server/alerts/alert-service";
import { requireWorkspaceViewer } from "@/src/server/auth/permissions";

const postSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("mark-read"),
    alertId: z.string().min(1),
  }),
  z.object({
    type: z.literal("mark-all-read"),
  }),
]);

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    await requireWorkspaceViewer({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const url = new URL(request.url);
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || 20)));
    const alerts = await listAlerts(user.workspaceId, user.id, limit);
    return apiSuccess({ alerts });
  } catch (error) {
    return apiError(error, "Unable to load alerts.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    await requireWorkspaceViewer({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const body = postSchema.parse(await request.json());
    if (body.type === "mark-read") {
      const alert = await markAlertRead(body.alertId, user.id, user.workspaceId);
      return apiSuccess({ alert });
    }
    await markAllAlertsRead(user.workspaceId, user.id);
    return apiSuccess({ ok: true });
  } catch (error) {
    return apiError(error, "Unable to update alerts.");
  }
}
