import { z } from "zod";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { claimReviewActions, NuruClaimReviewService } from "@/src/server/services/nuru-claim-review-service";
import { enforceNsiWriteRateLimit } from "@/src/server/security/nsi-write-rate-limit";

const bodySchema = z.object({ action: z.enum(claimReviewActions), reason: z.string().trim().min(3).max(2_000) });
export async function PATCH(request: Request, context: RouteContext<"/api/nuru/claims/[id]/review">) {
  try {
    const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    await enforceNsiWriteRateLimit(request, { operation: "write", userId: user.id, workspaceId: user.workspaceId });
    const { id } = await context.params; const review = bodySchema.parse(await request.json());
    return apiSuccess({ claim: await NuruClaimReviewService.review({ claimId: id, workspaceId: user.workspaceId, ...review }, `human:${user.id}`, crypto.randomUUID()) });
  } catch (error) { return apiError(error, "Unable to review the claim candidate."); }
}
