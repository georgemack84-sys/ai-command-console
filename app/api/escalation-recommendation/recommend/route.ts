import { apiError, apiSuccess } from "@/src/server/api/response";
import { generateEscalationRecommendationsRequest, requireEscalationRecommendationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireEscalationRecommendationUser();
    return apiSuccess(await generateEscalationRecommendationsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to generate escalation recommendations.");
  }
}
