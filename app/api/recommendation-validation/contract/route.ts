import { apiError, apiSuccess } from "@/src/server/api/response";
import { getRecommendationValidationContractResponse, requireRecommendationValidationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRecommendationValidationUser();
    return apiSuccess(getRecommendationValidationContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load recommendation validation contract.");
  }
}
