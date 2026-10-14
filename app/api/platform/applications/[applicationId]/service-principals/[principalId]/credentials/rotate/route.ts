import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { rotateServiceCredential } from "@/src/server/services/application-identity-service";

export async function POST(_request: Request, context: { params: Promise<{ applicationId: string; principalId: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const { applicationId, principalId } = await context.params;
    return apiSuccess({ credential: await rotateServiceCredential(user.workspaceId, applicationId, principalId, user.id) }, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to rotate application credential.");
  }
}
