import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRecommendationQualityRequest, requireRecommendationQualityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationQualityUser();
    return apiSuccess(await replayRecommendationQualityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay recommendation quality scoring.");
  }
}
