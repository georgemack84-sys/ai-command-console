import { z } from "zod";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requestSourceRefresh } from "@/src/server/services/source-service";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { enforceRateLimit, getDefaultWindowMs, getSourceRateLimit } from "@/src/server/security/rate-limit";

const bodySchema = z.object({
  sourceId: z.string().min(1),
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
    const job = await requestSourceRefresh({
      workspaceId: user.workspaceId,
      userId: user.id,
      userRole: user.role,
      sourceId: body.sourceId,
    });

    return apiSuccess({ job }, { status: 202 });
  } catch (error) {
    return apiError(error, "Unable to refresh source.");
  }
}
