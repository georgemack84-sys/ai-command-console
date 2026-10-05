import { apiError, apiSuccess } from "@/src/server/api/response";
import { AppError } from "@/src/server/api/errors";
import { getNuruDiscoverBranchInspection } from "@/src/server/services/nuru-discover-path-service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ relationshipId: string }> }) {
  try {
    const { relationshipId } = await context.params;
    const inspection = await getNuruDiscoverBranchInspection(relationshipId);
    if (!inspection) return apiError(new AppError(404, "approved_relationship_not_found", "Approved relationship not found."));
    return apiSuccess(inspection);
  } catch (error) {
    return apiError(error, "Unable to load the governed branch.");
  }
}
