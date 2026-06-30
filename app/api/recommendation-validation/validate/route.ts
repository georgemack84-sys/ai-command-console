import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRecommendationValidationUser, validateRecommendationValidationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationValidationUser();
    return apiSuccess(await validateRecommendationValidationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate recommendation validation result.");
  }
}
