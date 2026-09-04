import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { AuditLedgerVerifier, PrismaLearningAuditLedger } from "@/services/learning-constitution";

export const dynamic = "force-dynamic";

/** Independent, manager-only verification of the Phase 10 workspace audit chain. */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    if (!user.workspaceId || user.workspaceId === "default") throw new AppError(403, "workspace_required", "A workspace membership is required to verify audit integrity.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    return apiSuccess({ verification: await new AuditLedgerVerifier(new PrismaLearningAuditLedger(user.workspaceId)).verify(user.workspaceId) });
  } catch (error) { return apiError(error, "Unable to verify learning audit integrity."); }
}
