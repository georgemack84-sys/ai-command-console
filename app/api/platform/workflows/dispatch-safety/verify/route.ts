import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { verifyWorkflowSandbox } from "@/src/server/services/workflow-sandbox-verification-service";

export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    return apiSuccess(await verifyWorkflowSandbox({ workspaceId: user.workspaceId, actorId: user.id }));
  } catch (error) {
    return apiError(error, "Unable to verify the local workflow sandbox.");
  }
}
