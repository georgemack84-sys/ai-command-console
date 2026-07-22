import { apiError, apiSuccess } from "@/src/server/api/response";
import { getRecommendationEffectivenessCertificationContractResponse, requireRecommendationEffectivenessCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRecommendationEffectivenessCertificationUser();
    return apiSuccess(getRecommendationEffectivenessCertificationContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load recommendation effectiveness certification contract.");
  }
}
