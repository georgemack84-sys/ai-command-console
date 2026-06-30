import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayInterventionRecommendationRequest, requireInterventionRecommendationEngineUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireInterventionRecommendationEngineUser();
    return apiSuccess(await replayInterventionRecommendationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay intervention recommendation.");
  }
}
