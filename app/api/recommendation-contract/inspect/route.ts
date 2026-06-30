import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRecommendationContractRequest, requireRecommendationContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRecommendationContractUser();
    return apiSuccess(await inspectRecommendationContractRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect Recommendation Contract.");
  }
}

export async function POST(request: Request) {
  try {
    await requireRecommendationContractUser();
    return apiSuccess(await inspectRecommendationContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Recommendation Contract.");
  }
}
