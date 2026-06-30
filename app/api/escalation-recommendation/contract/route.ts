import { apiError, apiSuccess } from "@/src/server/api/response";
import { getEscalationRecommendationContractResponse, requireEscalationRecommendationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireEscalationRecommendationUser();
    return apiSuccess(getEscalationRecommendationContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load escalation recommendation contract.");
  }
}
