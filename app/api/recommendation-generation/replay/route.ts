import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRecommendationGenerationRequest, requireRecommendationGenerationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationGenerationUser();
    return apiSuccess(await replayRecommendationGenerationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay recommendation generation.");
  }
}
