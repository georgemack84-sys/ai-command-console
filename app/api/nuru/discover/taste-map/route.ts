import { getSessionUser } from "@/src/lib/auth";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { AppError } from "@/src/server/api/errors";
import { listNuruDiscoverCatalog } from "@/src/server/services/nuru-discover-catalog-service";
import { listNuruDiscoverInterestSignals } from "@/src/server/services/nuru-discover-interest-service";
import { buildNuruDiscoverTasteMap } from "@/src/server/services/nuru-discover-taste-map-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Sign in to view your Discover Taste Map.");
    const [catalog, signals] = await Promise.all([listNuruDiscoverCatalog(100), listNuruDiscoverInterestSignals(user.id)]);
    return apiSuccess(buildNuruDiscoverTasteMap(catalog, signals));
  } catch (error) {
    return apiError(error, "Unable to load the Nuru Discover Taste Map.");
  }
}
