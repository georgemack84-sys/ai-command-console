import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRecommendationAcceptanceRequest, requireRecommendationAcceptanceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRecommendationAcceptanceUser();
    return apiSuccess(await inspectRecommendationAcceptanceRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect recommendation acceptance analysis.");
  }
}

export async function POST(request: Request) {
  try {
    await requireRecommendationAcceptanceUser();
    return apiSuccess(await inspectRecommendationAcceptanceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect recommendation acceptance analysis.");
  }
}
