import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { revokeServiceCredential } from "@/src/server/services/application-identity-service";

export async function DELETE(_request: Request, context: { params: Promise<{ applicationId: string; principalId: string; credentialId: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const { applicationId, principalId, credentialId } = await context.params;
    return apiSuccess({ credential: await revokeServiceCredential(user.workspaceId, applicationId, principalId, credentialId, user.id) });
  } catch (error) {
    return apiError(error, "Unable to revoke application credential.");
  }
}
