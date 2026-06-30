import { apiError, apiSuccess } from "@/src/server/api/response";
import { hashRecommendationValidationRequest, requireRecommendationValidationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationValidationUser();
    return apiSuccess(await hashRecommendationValidationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to hash recommendation validation.");
  }
}
