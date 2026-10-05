import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { getNuruDiscoverCatalogDetail } from "@/src/server/services/nuru-discover-catalog-service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const detail = await getNuruDiscoverCatalogDetail(id);
    if (!detail) throw new AppError(404, "not_found", "This record is not available in Discover.");
    return apiSuccess(detail);
  } catch (error) {
    return apiError(error, "Unable to load this Discover record.");
  }
}
