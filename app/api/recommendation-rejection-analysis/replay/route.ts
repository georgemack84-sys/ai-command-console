import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRecommendationRejectionRequest, requireRecommendationRejectionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationRejectionUser();
    return apiSuccess(await replayRecommendationRejectionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay recommendation rejection analysis.");
  }
}
