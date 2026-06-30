import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireInterventionRecommendationEngineUser, validateInterventionRecommendationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireInterventionRecommendationEngineUser();
    return apiSuccess(await validateInterventionRecommendationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate intervention recommendation.");
  }
}
