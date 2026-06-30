import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRecommendationGenerationRequest, requireRecommendationGenerationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRecommendationGenerationUser();
    return apiSuccess(await inspectRecommendationGenerationRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect recommendation generation.");
  }
}

export async function POST(request: Request) {
  try {
    await requireRecommendationGenerationUser();
    return apiSuccess(await inspectRecommendationGenerationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect recommendation generation.");
  }
}
