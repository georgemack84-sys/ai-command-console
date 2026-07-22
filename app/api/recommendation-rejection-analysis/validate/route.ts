import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRecommendationRejectionUser, validateRecommendationRejectionRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationRejectionUser();
    return apiSuccess(await validateRecommendationRejectionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate recommendation rejection analysis.");
  }
}
