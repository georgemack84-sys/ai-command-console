import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { PrismaEpistemicSynthesisArtifactRepository } from "@/services/learning-constitution";

export const dynamic = "force-dynamic";

/** Inspection only. Synthesis artifacts are created through governed services, never this API. */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    if (!user.workspaceId || user.workspaceId === "default") throw new AppError(403, "workspace_required", "Workspace membership is required.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    return apiSuccess({ artifacts: await new PrismaEpistemicSynthesisArtifactRepository(user.workspaceId).listWorkspaceArtifacts() });
  } catch (error) { return apiError(error, "Unable to load epistemic synthesis artifacts."); }
}
