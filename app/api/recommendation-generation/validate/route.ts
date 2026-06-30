import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRecommendationGenerationUser, validateRecommendationGenerationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationGenerationUser();
    return apiSuccess(await validateRecommendationGenerationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate recommendation generation.");
  }
}
