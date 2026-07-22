import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRecommendationEffectivenessRequest, requireRecommendationEffectivenessUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationEffectivenessUser();
    return apiSuccess(await replayRecommendationEffectivenessRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay recommendation effectiveness.");
  }
}
