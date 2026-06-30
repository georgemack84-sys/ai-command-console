import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRecommendationCertificationRequest, requireRecommendationCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationCertificationUser();
    return apiSuccess(await replayRecommendationCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay recommendation certification.");
  }
}
