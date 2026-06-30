import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRecommendationContractRequest, requireRecommendationContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationContractUser();
    return apiSuccess(await replayRecommendationContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay Recommendation Contract.");
  }
}
