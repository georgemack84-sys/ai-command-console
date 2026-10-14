import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { dispatchWorkflowSandboxStep } from "@/src/server/services/workflow-sandbox-dispatch-service";

/** Dispatches only to the verified, owner-approved built-in local sandbox. */
export async function POST(request: Request, context: { params: Promise<{ workflowRunId: string; stepKey: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const { workflowRunId, stepKey } = await context.params;
    return apiSuccess(await dispatchWorkflowSandboxStep(user.workspaceId, { ...(await request.json()), workflowRunId, stepKey }), { status: 202 });
  } catch (error) {
    return apiError(error, "Unable to dispatch the workflow step to the local sandbox.");
  }
}
