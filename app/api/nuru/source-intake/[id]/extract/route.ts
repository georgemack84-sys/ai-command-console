import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { NuruDocumentExtractionService } from "@/src/server/services/nuru-document-extraction-service";
import { enforceNsiWriteRateLimit } from "@/src/server/security/nsi-write-rate-limit";

export async function POST(request: Request, context: RouteContext<"/api/nuru/source-intake/[id]/extract">) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    await enforceNsiWriteRateLimit(request, { operation: "write", userId: user.id, workspaceId: user.workspaceId });
    const { id } = await context.params;
    const document = await NuruDocumentExtractionService.extract({ rawArtifactId: id, workspaceId: user.workspaceId }, `human:${user.id}`, crypto.randomUUID());
    return apiSuccess({ document }, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to extract the source artifact.");
  }
}
