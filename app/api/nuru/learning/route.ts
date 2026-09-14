import { getSessionUser } from "@/src/lib/auth";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { getNuruLearningActivity } from "@/src/server/services/nuru-learning-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return apiSuccess({ signedIn: false, activity: [] });
    return apiSuccess({ signedIn: true, activity: await getNuruLearningActivity(user.id) });
  } catch (error) { return apiError(error, "Unable to load what Nuru has learned."); }
}
