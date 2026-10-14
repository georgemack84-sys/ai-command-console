import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { publishWorkflowDefinition } from "@/src/server/services/workflow-coordinator-service";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    return apiSuccess(await publishWorkflowDefinition(user.workspaceId, user.id, await request.json()), { status: 201 });
  } catch (error) { return apiError(error, "Unable to publish workflow version."); }
}
