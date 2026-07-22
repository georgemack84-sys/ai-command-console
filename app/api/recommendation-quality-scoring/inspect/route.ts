import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRecommendationQualityRequest, requireRecommendationQualityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRecommendationQualityUser();
    return apiSuccess(await inspectRecommendationQualityRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect recommendation quality scoring.");
  }
}

export async function POST(request: Request) {
  try {
    await requireRecommendationQualityUser();
    return apiSuccess(await inspectRecommendationQualityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect recommendation quality scoring.");
  }
}
