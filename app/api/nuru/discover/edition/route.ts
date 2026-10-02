import { apiError, apiSuccess } from "@/src/server/api/response";
import { getNuruDiscoverEdition } from "@/src/server/services/nuru-discover-edition-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return apiSuccess(await getNuruDiscoverEdition());
  } catch (error) {
    return apiError(error, "Unable to prepare today’s Discover edition.");
  }
}
