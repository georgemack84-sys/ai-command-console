import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRecommendationQualityUser, validateRecommendationQualityRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationQualityUser();
    return apiSuccess(await validateRecommendationQualityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate recommendation quality scoring.");
  }
}
