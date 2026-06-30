import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectInterventionRecommendationRequest, requireInterventionRecommendationEngineUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireInterventionRecommendationEngineUser();
    return apiSuccess(await inspectInterventionRecommendationRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect Intervention Recommendation Engine.");
  }
}

export async function POST(request: Request) {
  try {
    await requireInterventionRecommendationEngineUser();
    return apiSuccess(await inspectInterventionRecommendationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Intervention Recommendation Engine.");
  }
}
