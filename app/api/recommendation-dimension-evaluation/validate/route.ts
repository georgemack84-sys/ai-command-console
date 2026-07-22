import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRecommendationDimensionUser, validateRecommendationDimensionRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationDimensionUser();
    return apiSuccess(await validateRecommendationDimensionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate recommendation dimension evaluation.");
  }
}
