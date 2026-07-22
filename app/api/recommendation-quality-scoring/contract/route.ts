import { apiError, apiSuccess } from "@/src/server/api/response";
import { getRecommendationQualityContractResponse, requireRecommendationQualityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRecommendationQualityUser();
    return apiSuccess(getRecommendationQualityContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load recommendation quality scoring contract.");
  }
}
