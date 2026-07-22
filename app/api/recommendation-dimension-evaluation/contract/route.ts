import { apiError, apiSuccess } from "@/src/server/api/response";
import { getRecommendationDimensionContractResponse, requireRecommendationDimensionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRecommendationDimensionUser();
    return apiSuccess(getRecommendationDimensionContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load recommendation dimension evaluation contract.");
  }
}
