import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { createDeferredCandidateReviewQueue } from "@/src/server/learning/deferred-candidate-review-runtime";

export const dynamic = "force-dynamic";

/** Read-only queue endpoint: approval must return through full gate re-evaluation. */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    if (!user.workspaceId || user.workspaceId === "default") throw new AppError(403, "workspace_required", "A workspace membership is required to review deferred learning candidates.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const candidates = await createDeferredCandidateReviewQueue(user.workspaceId).listPending();
    return apiSuccess({ candidates });
  } catch (error) {
    return apiError(error, "Unable to load deferred learning candidates.");
  }
}
