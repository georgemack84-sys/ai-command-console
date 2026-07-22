import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRecommendationEffectivenessCertificationRequest, requireRecommendationEffectivenessCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationEffectivenessCertificationUser();
    return apiSuccess(await replayRecommendationEffectivenessCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay recommendation effectiveness certification.");
  }
}
