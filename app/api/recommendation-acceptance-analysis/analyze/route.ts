import { apiError, apiSuccess } from "@/src/server/api/response";
import { analyzeRecommendationAcceptanceRequest, requireRecommendationAcceptanceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationAcceptanceUser();
    return apiSuccess(await analyzeRecommendationAcceptanceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to analyze recommendation acceptance.");
  }
}
