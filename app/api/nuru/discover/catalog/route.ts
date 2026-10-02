import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireNuruGovernor } from "@/src/server/api/nuru-api";
import { listNuruDiscoverCatalog, listNuruDiscoverCatalogDecisions } from "@/src/server/services/nuru-discover-catalog-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireNuruGovernor();
    const includeDecisions = new URL(request.url).searchParams.get("decisions") === "all";
    return apiSuccess(includeDecisions ? await listNuruDiscoverCatalogDecisions() : await listNuruDiscoverCatalog());
  } catch (error) {
    return apiError(error, "Unable to load the Nuru Discover catalog.");
  }
}
