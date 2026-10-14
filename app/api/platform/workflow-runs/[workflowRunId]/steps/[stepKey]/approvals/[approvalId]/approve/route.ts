import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceOwner } from "@/src/server/auth/permissions";
import { approveWorkflowStepApproval } from "@/src/server/services/workflow-step-approval-service";

export async function POST(_request: Request, context: { params: Promise<{ workflowRunId: string; stepKey: string; approvalId: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceOwner({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const { approvalId } = await context.params;
    return apiSuccess({ approval: await approveWorkflowStepApproval(user.workspaceId, approvalId, user.id) });
  } catch (error) { return apiError(error, "Unable to approve workflow step."); }
}
