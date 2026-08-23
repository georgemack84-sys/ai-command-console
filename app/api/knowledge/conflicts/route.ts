import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { ConflictIntegrityScanner, ConflictQueryService, PrismaProvenanceLedger } from "@/services/learning-constitution";
import { CONFLICT_STATUSES } from "@/types/learning-constitution";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    if (!user.workspaceId || user.workspaceId === "default") throw new AppError(403, "workspace_required", "A workspace membership is required to read conflicts.");
    const searchParams = new URL(request.url).searchParams;
    const status = searchParams.get("status") ?? undefined;
    if (status && !CONFLICT_STATUSES.includes(status as (typeof CONFLICT_STATUSES)[number])) throw new AppError(400, "invalid_conflict_status", "The requested conflict status is not recognized.");
    const includeIntegrity = searchParams.get("integrity") === "true";
    const ledger = new PrismaProvenanceLedger(user.workspaceId);
    const conflicts = await new ConflictQueryService(ledger).list(status as (typeof CONFLICT_STATUSES)[number] | undefined);
    const integrity = includeIntegrity ? await new ConflictIntegrityScanner(ledger).scan() : undefined;
    return apiSuccess({ conflicts, integrity });
  } catch (error) { return apiError(error, "Unable to list Noesis conflicts."); }
}
