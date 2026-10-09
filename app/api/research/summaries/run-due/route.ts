import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { executeGovernedScheduledSummaryAction } from "@/src/server/services/governed-scheduled-summary-action-service";
import { scheduledSummaryActionSchema } from "@/src/server/services/scheduled-summary-action-service";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const body = scheduledSummaryActionSchema.parse(await request.json());
    const result = await executeGovernedScheduledSummaryAction(body, user);
    if (result.requiresConfirmation || result.simulated) {
      return apiSuccess(result);
    }
    const actionResult = result as unknown as { data: unknown; status?: number };
    return apiSuccess(actionResult.data, actionResult.status ? { status: actionResult.status } : undefined);
  } catch (error) {
    return apiError(error, "Unable to run scheduled summaries.");
  }
}
