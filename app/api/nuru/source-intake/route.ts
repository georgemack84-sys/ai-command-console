import { getSessionUser } from "@/src/lib/auth";
import { manualIntakeSchema } from "@/src/nuru/manual-intake";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager, requireWorkspaceViewer } from "@/src/server/auth/permissions";
import { NuruManualIngestionService } from "@/src/server/services/nuru-manual-ingestion-service";
import { NuruDocumentExtractionService } from "@/src/server/services/nuru-document-extraction-service";
import { readJsonWithinLimit } from "@/src/server/security/request-body-limit";
import { enforceNsiWriteRateLimit } from "@/src/server/security/nsi-write-rate-limit";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceViewer({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const [artifacts, documents] = await Promise.all([NuruManualIngestionService.listForWorkspace(user.workspaceId), NuruDocumentExtractionService.listForWorkspace(user.workspaceId)]);
    return apiSuccess({ artifacts, documents });
  } catch (error) {
    return apiError(error, "Unable to load source artifact receipts.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    await enforceNsiWriteRateLimit(request, { operation: "write", userId: user.id, workspaceId: user.workspaceId });
    const payload = await readJsonWithinLimit(request, 10 * 1024 * 1024);
    const body = manualIntakeSchema.parse({ ...(typeof payload === "object" && payload !== null ? payload : {}), workspaceId: user.workspaceId });
    const artifact = await NuruManualIngestionService.ingest(body, `human:${user.id}`, crypto.randomUUID());
    return apiSuccess({ artifact }, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to ingest the source material.");
  }
}
