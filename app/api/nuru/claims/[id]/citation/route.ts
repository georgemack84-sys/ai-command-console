import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceViewer } from "@/src/server/auth/permissions";
import { NuruCitationService } from "@/src/server/services/nuru-citation-service";

export async function GET(_request: Request, context: RouteContext<"/api/nuru/claims/[id]/citation">) {
  try {
    const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceViewer({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const { id } = await context.params;
    return apiSuccess({ citation: await NuruCitationService.forClaim(id, user.workspaceId) });
  } catch (error) { return apiError(error, "Unable to resolve the claim citation."); }
}
