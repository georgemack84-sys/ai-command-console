import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager, requireWorkspaceViewer } from "@/src/server/auth/permissions";
import { declareApplicationCapability, discoverApplicationCapabilities } from "@/src/server/services/application-capability-service";

async function viewer() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceViewer({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

export async function GET(_request: Request, context: { params: Promise<{ applicationId: string }> }) {
  try {
    const user = await viewer();
    const { applicationId } = await context.params;
    return apiSuccess({ capabilities: await discoverApplicationCapabilities(user.workspaceId, applicationId) });
  } catch (error) {
    return apiError(error, "Unable to discover application capabilities.");
  }
}

export async function POST(request: Request, context: { params: Promise<{ applicationId: string }> }) {
  try {
    const user = await viewer();
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const { applicationId } = await context.params;
    return apiSuccess({ capability: await declareApplicationCapability(user.workspaceId, applicationId, user.id, await request.json()) }, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to declare application capability.");
  }
}
