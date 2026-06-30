import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireEscalationRecommendationUser, validateEscalationRecommendationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireEscalationRecommendationUser();
    return apiSuccess(await validateEscalationRecommendationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate escalation recommendations.");
  }
}
