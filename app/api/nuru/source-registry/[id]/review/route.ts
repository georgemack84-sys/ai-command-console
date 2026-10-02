import { z } from "zod";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { NuruSourceRegistryService, sourceReviewActionSchema } from "@/src/server/services/nuru-source-registry-service";
import { enforceNsiWriteRateLimit } from "@/src/server/security/nsi-write-rate-limit";

const reviewSchema = z.object({
  action: sourceReviewActionSchema,
  reason: z.string().trim().min(3).max(2_000),
});

export async function PATCH(request: Request, context: RouteContext<"/api/nuru/source-registry/[id]/review">) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    await enforceNsiWriteRateLimit(request, { operation: "write", userId: user.id, workspaceId: user.workspaceId });
    const { id } = await context.params;
    const review = reviewSchema.parse(await request.json());
    const source = await NuruSourceRegistryService.review(id, user.workspaceId, review.action, review.reason, `human:${user.id}`, crypto.randomUUID());
    return apiSuccess({ source });
  } catch (error) {
    return apiError(error, "Unable to review the Nuru source.");
  }
}
