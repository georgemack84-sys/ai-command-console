import { apiError, apiSuccess } from "@/src/server/api/response";
import { getRecommendationPathsContractResponse, requireRecommendationPathsUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRecommendationPathsUser();
    return apiSuccess(getRecommendationPathsContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load Alternative Governance Paths contract.");
  }
}
