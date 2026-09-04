import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { PrismaCorrectionRepository } from "@/services/learning-constitution";

export const dynamic = "force-dynamic";

/** Manager-only view of an immutable Phase 12 correction case. */
export async function GET(_request: Request, context: Readonly<{ params: Promise<{ correctionId: string }> }>) {
  try {
    const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    if (!user.workspaceId || user.workspaceId === "default") throw new AppError(403, "workspace_required", "A workspace membership is required to inspect corrections.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const { correctionId } = await context.params; if (!correctionId.trim()) throw new AppError(400, "correction_id_required", "Correction identifier is required.");
    const correction = await new PrismaCorrectionRepository(user.workspaceId).get(correctionId);
    if (!correction) throw new AppError(404, "correction_not_found", "Correction was not found.");
    return apiSuccess({ correction });
  } catch (error) { return apiError(error, "Unable to load correction history."); }
}
