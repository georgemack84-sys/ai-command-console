import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { executeGovernedResearchReportMutation } from "@/src/server/services/governed-research-report-mutation-service";
import { listReports } from "@/src/server/services/research-service";
import { requireWorkspaceMember, requireWorkspaceViewer } from "@/src/server/auth/permissions";

async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new AppError(401, "unauthorized", "Authentication required.");
  }
  return user;
}

export async function GET() {
  try {
    const user = await requireUser();
    await requireWorkspaceViewer({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    return apiSuccess({ reports: await listReports(user.workspaceId) });
  } catch (error) {
    return apiError(error, "Unable to load reports.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    return await executeMutationResponse("create", await request.json(), user);
  } catch (error) {
    return apiError(error, "Unable to create report.");
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    return await executeMutationResponse("update", await request.json(), user);
  } catch (error) {
    return apiError(error, "Unable to update report.");
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    return await executeMutationResponse("delete", await request.json(), user);
  } catch (error) {
    return apiError(error, "Unable to delete report.");
  }
}

async function executeMutationResponse(
  action: "create" | "update" | "delete",
  body: Record<string, unknown>,
  user: Awaited<ReturnType<typeof requireUser>>,
) {
  const result = await executeGovernedResearchReportMutation(
    { action, payload: body, confirmed: body.confirmed === true },
    user,
  );
  if (result.requiresConfirmation || result.simulated) {
    return apiSuccess(result);
  }
  const mutationResult = result as unknown as { data: unknown; status?: number };
  return apiSuccess(mutationResult.data, mutationResult.status ? { status: mutationResult.status } : undefined);
}
