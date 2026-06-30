import { apiError, apiSuccess } from "@/src/server/api/response";
import { interventionRecommendationEvidenceRequest, requireInterventionRecommendationEngineUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireInterventionRecommendationEngineUser();
    return apiSuccess(await interventionRecommendationEvidenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve intervention recommendation evidence.");
  }
}
