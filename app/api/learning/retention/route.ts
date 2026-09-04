import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { PrismaRetentionArtifactRepository } from "@/services/learning-constitution";

export const dynamic = "force-dynamic";

/** Read-only retention inspection; this endpoint cannot schedule, evaluate, or change retention claims. */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    if (!user.workspaceId || user.workspaceId === "default") throw new AppError(403, "workspace_required", "Workspace membership is required.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const artifacts = await new PrismaRetentionArtifactRepository(user.workspaceId).listWorkspaceArtifacts();
    return apiSuccess({ artifacts });
  } catch (error) {
    return apiError(error, "Unable to load retention artifacts.");
  }
}
