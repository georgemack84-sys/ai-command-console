import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRecommendationQualityUser, scoreRecommendationQualityRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationQualityUser();
    return apiSuccess(await scoreRecommendationQualityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to score recommendation quality.");
  }
}
