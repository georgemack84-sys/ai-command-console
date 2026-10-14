import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { getWorkflowDispatchSafety } from "@/src/server/services/workflow-dispatch-safety-service";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    return apiSuccess(await getWorkflowDispatchSafety(user.workspaceId));
  } catch (error) {
    return apiError(error, "Unable to load workflow dispatch safety status.");
  }
}
