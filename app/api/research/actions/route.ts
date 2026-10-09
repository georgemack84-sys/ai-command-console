import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { executeGovernedResearchAction } from "@/src/server/services/governed-research-action-service";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const result = await executeGovernedResearchAction(await request.json(), user);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error, "Unable to execute research action.");
  }
}
