import { apiError, apiSuccess } from "@/src/server/api/response";
import { evaluateSingleDimensionRequest, requireRecommendationDimensionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationDimensionUser();
    return apiSuccess(await evaluateSingleDimensionRequest(request, "RISK"));
  } catch (error) {
    return apiError(error, "Unable to evaluate risk dimension.");
  }
}
