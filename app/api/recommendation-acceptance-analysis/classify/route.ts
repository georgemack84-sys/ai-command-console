import { apiError, apiSuccess } from "@/src/server/api/response";
import { classifyRecommendationAcceptanceRequest, requireRecommendationAcceptanceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationAcceptanceUser();
    return apiSuccess(await classifyRecommendationAcceptanceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to classify recommendation acceptance.");
  }
}
