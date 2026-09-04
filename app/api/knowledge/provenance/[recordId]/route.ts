import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { PrismaProvenanceLedger, ProvenanceQueryService } from "@/services/learning-constitution";

export async function GET(_request: Request, { params }: { params: Promise<{ recordId: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    if (!user.workspaceId || user.workspaceId === "default") throw new AppError(403, "workspace_required", "A workspace membership is required to read provenance.");
    const { recordId } = await params;
    const ledger = new PrismaProvenanceLedger(user.workspaceId);
    if (!await ledger.get(recordId)) throw new AppError(404, "provenance_not_found", "Noesis has no provenance record with that id.");
    return apiSuccess({ explanation: await new ProvenanceQueryService(ledger).explain(recordId) });
  } catch (error) {
    return apiError(error, "Unable to retrieve Noesis provenance.");
  }
}
