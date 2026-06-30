import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRecommendationContractUser, validateRecommendationContractRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationContractUser();
    return apiSuccess(await validateRecommendationContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate Recommendation Contract.");
  }
}
