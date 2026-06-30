import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRecommendationContractUser, transitionRecommendationContractRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationContractUser();
    return apiSuccess(await transitionRecommendationContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to transition Recommendation Contract lifecycle.");
  }
}
