import { apiError, apiSuccess } from "@/src/server/api/response";
import { metricsEscalationRecommendationRequest, requireEscalationRecommendationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireEscalationRecommendationUser();
    return apiSuccess(await metricsEscalationRecommendationRequest());
  } catch (error) {
    return apiError(error, "Unable to load escalation recommendation metrics.");
  }
}

export async function POST(request: Request) {
  try {
    await requireEscalationRecommendationUser();
    return apiSuccess(await metricsEscalationRecommendationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load escalation recommendation metrics.");
  }
}
