import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRecommendationAcceptanceUser, validateRecommendationAcceptanceRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationAcceptanceUser();
    return apiSuccess(await validateRecommendationAcceptanceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate recommendation acceptance analysis.");
  }
}
