import { apiError, apiSuccess } from "@/src/server/api/response";
import { getRecommendationContractResponse, requireRecommendationContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRecommendationContractUser();
    return apiSuccess(getRecommendationContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load Recommendation Contract.");
  }
}
