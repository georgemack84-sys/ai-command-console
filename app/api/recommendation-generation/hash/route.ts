import { apiError, apiSuccess } from "@/src/server/api/response";
import { hashRecommendationGenerationRequest, requireRecommendationGenerationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationGenerationUser();
    return apiSuccess(await hashRecommendationGenerationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to hash recommendation generation.");
  }
}
