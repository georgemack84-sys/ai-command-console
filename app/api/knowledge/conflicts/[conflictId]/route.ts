import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { ConflictQueryService, PrismaProvenanceLedger } from "@/services/learning-constitution";

export async function GET(_request: Request, { params }: { params: Promise<{ conflictId: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    if (!user.workspaceId || user.workspaceId === "default") throw new AppError(403, "workspace_required", "A workspace membership is required to read conflicts.");
    const result = await new ConflictQueryService(new PrismaProvenanceLedger(user.workspaceId)).get((await params).conflictId);
    if (!result) throw new AppError(404, "conflict_not_found", "Noesis has no conflict with that identifier.");
    return apiSuccess(result);
  } catch (error) { return apiError(error, "Unable to retrieve the Noesis conflict."); }
}
