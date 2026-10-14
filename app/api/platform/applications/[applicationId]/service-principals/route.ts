import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { createServicePrincipal } from "@/src/server/services/application-identity-service";

export async function POST(request: Request, context: { params: Promise<{ applicationId: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const { applicationId } = await context.params;
    return apiSuccess(await createServicePrincipal(user.workspaceId, applicationId, user.id, await request.json()), { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to create application service principal.");
  }
}
