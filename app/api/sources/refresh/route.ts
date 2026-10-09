import { z } from "zod";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { enforceRateLimit, getDefaultWindowMs, getSourceRateLimit } from "@/src/server/security/rate-limit";
import { executeGovernedSourceRefreshAction } from "@/src/server/services/governed-source-refresh-action-service";

const bodySchema = z.object({
  sourceId: z.string().min(1),
  confirmed: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    enforceRateLimit(`sources:refresh:${user.id}`, { limit: getSourceRateLimit(), windowMs: getDefaultWindowMs() });
    const body = bodySchema.parse(await request.json());
    const result = await executeGovernedSourceRefreshAction(body, user);
    if (result.requiresConfirmation || result.simulated) {
      return apiSuccess(result);
    }
    const actionResult = result as unknown as { data: unknown; status?: number };
    return apiSuccess(actionResult.data, actionResult.status ? { status: actionResult.status } : undefined);
  } catch (error) {
    return apiError(error, "Unable to refresh source.");
  }
}
