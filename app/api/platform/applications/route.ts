import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager, requireWorkspaceViewer } from "@/src/server/auth/permissions";
import { listRegisteredApplications, registerApplication } from "@/src/server/services/application-registry-service";

async function viewer() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceViewer({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

export async function GET() {
  try {
    const user = await viewer();
    return apiSuccess({ applications: await listRegisteredApplications(user.workspaceId) });
  } catch (error) {
    return apiError(error, "Unable to load registered applications.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await viewer();
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const result = await registerApplication(user.workspaceId, user.id, await request.json());
    return apiSuccess(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    return apiError(error, "Unable to register application.");
  }
}
