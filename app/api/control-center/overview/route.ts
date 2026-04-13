import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { ensureDigestScheduler } from "@/services/digestScheduler";
import { buildControlCenterOverview } from "@/src/server/services/control-center-service";
import { requireWorkspaceViewer } from "@/src/server/auth/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    ensureDigestScheduler();
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    await requireWorkspaceViewer({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    return apiSuccess({
      overview: await buildControlCenterOverview(user),
    });
  } catch (error) {
    return apiError(error, "Unable to load control center overview.");
  }
}
