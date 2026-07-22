import { apiError, apiSuccess } from "@/src/server/api/response";
import { correlateRecommendationAcceptanceRequest, requireRecommendationAcceptanceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationAcceptanceUser();
    return apiSuccess(await correlateRecommendationAcceptanceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to correlate recommendation acceptance outcomes.");
  }
}
