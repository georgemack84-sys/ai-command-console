import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { PrismaAutonomousPracticeArtifactRepository } from "@/services/learning-constitution";

export const dynamic = "force-dynamic";

/** Inspection only. Sealed answer-key payloads are deliberately excluded from every learner-facing response. */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    if (!user.workspaceId || user.workspaceId === "default") throw new AppError(403, "workspace_required", "Workspace membership is required.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const artifacts = await new PrismaAutonomousPracticeArtifactRepository(user.workspaceId).listWorkspaceArtifacts();
    return apiSuccess({ artifacts: artifacts.filter((artifact) => artifact.artifactType !== "SEALED_ANSWER_KEY"), sealedAnswerKeyCount: artifacts.filter((artifact) => artifact.artifactType === "SEALED_ANSWER_KEY").length });
  } catch (error) { return apiError(error, "Unable to load autonomous practice artifacts."); }
}
