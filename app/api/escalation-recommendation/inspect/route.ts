import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectEscalationRecommendationRequest, requireEscalationRecommendationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireEscalationRecommendationUser();
    return apiSuccess(await inspectEscalationRecommendationRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect escalation recommendations.");
  }
}

export async function POST(request: Request) {
  try {
    await requireEscalationRecommendationUser();
    return apiSuccess(await inspectEscalationRecommendationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect escalation recommendations.");
  }
}
