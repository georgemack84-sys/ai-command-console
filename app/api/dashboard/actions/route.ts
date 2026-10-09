import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { executeGovernedDashboardAction } from "@/src/server/services/governed-dashboard-action-service";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const result = await executeGovernedDashboardAction(await request.json(), user);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error, "Unable to execute dashboard action.");
  }
}
