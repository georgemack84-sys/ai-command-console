import { apiError, apiSuccess } from "@/src/server/api/response";
import { getNuruDiscoverPathReadiness } from "@/src/server/services/nuru-discover-path-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return apiSuccess(await getNuruDiscoverPathReadiness());
  } catch (error) {
    return apiError(error, "Unable to load governed discovery paths.");
  }
}
