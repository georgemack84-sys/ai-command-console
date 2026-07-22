import { apiError, apiSuccess } from "@/src/server/api/response";
import { evaluateRecommendationDimensionRequest, requireRecommendationDimensionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationDimensionUser();
    return apiSuccess(await evaluateRecommendationDimensionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to evaluate recommendation dimensions.");
  }
}
