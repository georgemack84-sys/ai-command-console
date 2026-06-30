import { apiError, apiSuccess } from "@/src/server/api/response";
import { certifyRecommendationContractRequest, requireRecommendationContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRecommendationContractUser();
    return apiSuccess(await certifyRecommendationContractRequest());
  } catch (error) {
    return apiError(error, "Unable to certify Recommendation Contract.");
  }
}

export async function POST(request: Request) {
  try {
    await requireRecommendationContractUser();
    return apiSuccess(await certifyRecommendationContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to certify Recommendation Contract.");
  }
}
