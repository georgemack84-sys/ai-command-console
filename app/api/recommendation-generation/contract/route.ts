import { apiError, apiSuccess } from "@/src/server/api/response";
import { getRecommendationGenerationContractResponse, requireRecommendationGenerationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRecommendationGenerationUser();
    return apiSuccess(getRecommendationGenerationContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load Recommendation Generation contract.");
  }
}
