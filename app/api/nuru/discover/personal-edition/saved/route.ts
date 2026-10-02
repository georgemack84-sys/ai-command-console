import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { listSavedNuruPersonalEditionDiscoveries } from "@/src/server/services/nuru-personal-edition-saved-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Sign in to view saved discoveries.");
    return apiSuccess({ discoveries: await listSavedNuruPersonalEditionDiscoveries(user.id) });
  } catch (error) {
    return apiError(error, "Unable to load saved discoveries.");
  }
}
