import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRecommendationDimensionRequest, requireRecommendationDimensionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationDimensionUser();
    return apiSuccess(await replayRecommendationDimensionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay recommendation dimension evaluation.");
  }
}
