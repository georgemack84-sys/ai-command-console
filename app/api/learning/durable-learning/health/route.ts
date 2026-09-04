import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { GateObservabilityService, PrismaGateAuditLedger } from "@/services/learning-constitution";

export const dynamic = "force-dynamic";

/** Manager-only, read-only health signal for the Phase 9 commit boundary. */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    if (!user.workspaceId || user.workspaceId === "default") throw new AppError(403, "workspace_required", "A workspace membership is required to inspect durable learning health.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const health = await new GateObservabilityService(new PrismaGateAuditLedger(user.workspaceId)).summarize();
    return apiSuccess({ health });
  } catch (error) {
    return apiError(error, "Unable to load durable learning health.");
  }
}
