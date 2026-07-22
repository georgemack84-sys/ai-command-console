import { apiError, apiSuccess } from "@/src/server/api/response";
import { getRecommendationRejectionContractResponse, requireRecommendationRejectionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRecommendationRejectionUser();
    return apiSuccess(getRecommendationRejectionContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load recommendation rejection analysis contract.");
  }
}
