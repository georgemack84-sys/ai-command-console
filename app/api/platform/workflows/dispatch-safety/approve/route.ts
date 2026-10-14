import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceOwner } from "@/src/server/auth/permissions";
import { approveWorkflowSandbox } from "@/src/server/services/workflow-sandbox-verification-service";

export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceOwner({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    return apiSuccess(await approveWorkflowSandbox({ workspaceId: user.workspaceId, actorId: user.id }));
  } catch (error) {
    return apiError(error, "Unable to approve the local workflow sandbox.");
  }
}
