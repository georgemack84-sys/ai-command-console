import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager, requireWorkspaceViewer } from "@/src/server/auth/permissions";
import { NuruClaimExtractionService } from "@/src/server/services/nuru-claim-extraction-service";
import { enforceNsiWriteRateLimit } from "@/src/server/security/nsi-write-rate-limit";

export async function GET(_request: Request, context: RouteContext<"/api/nuru/documents/[id]/claims">) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceViewer({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const { id } = await context.params;
    return apiSuccess({ claims: await NuruClaimExtractionService.listForDocument(id, user.workspaceId) });
  } catch (error) { return apiError(error, "Unable to load claim candidates."); }
}

export async function POST(request: Request, context: RouteContext<"/api/nuru/documents/[id]/claims">) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    await enforceNsiWriteRateLimit(request, { operation: "write", userId: user.id, workspaceId: user.workspaceId });
    const { id } = await context.params;
    return apiSuccess({ claims: await NuruClaimExtractionService.generate({ normalizedDocumentId: id, workspaceId: user.workspaceId }, `human:${user.id}`, crypto.randomUUID()) }, { status: 201 });
  } catch (error) { return apiError(error, "Unable to generate claim candidates."); }
}
