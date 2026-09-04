import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { PrismaPrincipleLearningRepository } from "@/services/learning-constitution";

export const dynamic = "force-dynamic";

/** Manager-only immutable history for a Phase 13 pattern, candidate, or durable principle subject. */
export async function GET(_request: Request, context: Readonly<{ params: Promise<{ subjectId: string }> }>) {
  try {
    const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    if (!user.workspaceId || user.workspaceId === "default") throw new AppError(403, "workspace_required", "A workspace membership is required to inspect principles.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const { subjectId } = await context.params; if (!subjectId.trim()) throw new AppError(400, "principle_subject_required", "Principle subject identifier is required.");
    return apiSuccess({ artifacts: await new PrismaPrincipleLearningRepository(user.workspaceId).listArtifacts(subjectId) });
  } catch (error) { return apiError(error, "Unable to load principle history."); }
}
