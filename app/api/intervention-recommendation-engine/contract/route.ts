import { apiError, apiSuccess } from "@/src/server/api/response";
import { getInterventionRecommendationContractResponse, requireInterventionRecommendationEngineUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireInterventionRecommendationEngineUser();
    return apiSuccess(getInterventionRecommendationContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load Intervention Recommendation Engine contract.");
  }
}
