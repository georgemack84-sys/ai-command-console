import { getSessionUser } from "@/src/lib/auth";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { AppError } from "@/src/server/api/errors";
import { getWorkspaceSnapshot } from "@/src/server/services/workspace-service";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    const snapshot = await getWorkspaceSnapshot(user.workspaceId);
    return apiSuccess({ sources: snapshot.sources });
  } catch (error) {
    return apiError(error, "Unable to load sources.");
  }
}
