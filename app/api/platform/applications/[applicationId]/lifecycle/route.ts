import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceOwner } from "@/src/server/auth/permissions";
import { transitionApplicationLifecycle } from "@/src/server/services/application-lifecycle-service";

export async function PATCH(request: Request, context: { params: Promise<{ applicationId: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceOwner({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const { applicationId } = await context.params;
    return apiSuccess({ lifecycle: await transitionApplicationLifecycle(user.workspaceId, applicationId, user.id, await request.json()) });
  } catch (error) {
    return apiError(error, "Unable to transition application lifecycle.");
  }
}
