import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { ConflictQueryService, PrismaProvenanceLedger } from "@/services/learning-constitution";
import { CONFLICT_STATUSES } from "@/types/learning-constitution";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    if (!user.workspaceId || user.workspaceId === "default") throw new AppError(403, "workspace_required", "A workspace membership is required to read conflicts.");
    const status = new URL(request.url).searchParams.get("status") ?? undefined;
    if (status && !CONFLICT_STATUSES.includes(status as (typeof CONFLICT_STATUSES)[number])) throw new AppError(400, "invalid_conflict_status", "The requested conflict status is not recognized.");
    const conflicts = await new ConflictQueryService(new PrismaProvenanceLedger(user.workspaceId)).list(status as (typeof CONFLICT_STATUSES)[number] | undefined);
    return apiSuccess({ conflicts });
  } catch (error) { return apiError(error, "Unable to list Noesis conflicts."); }
}
