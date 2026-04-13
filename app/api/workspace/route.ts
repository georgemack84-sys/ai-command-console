import { getSessionUser } from "@/src/lib/auth";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { AppError } from "@/src/server/api/errors";
import { getWorkspaceSnapshot } from "@/src/server/services/workspace-service";
import { requireWorkspaceViewer } from "@/src/server/auth/permissions";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    await requireWorkspaceViewer({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    return apiSuccess(await getWorkspaceSnapshot(user.workspaceId));
  } catch (error) {
    return apiError(error, "Unable to load workspace.");
  }
}
