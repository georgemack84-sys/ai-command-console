import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayEscalationRecommendationRequest, requireEscalationRecommendationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireEscalationRecommendationUser();
    return apiSuccess(await replayEscalationRecommendationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay escalation recommendations.");
  }
}
