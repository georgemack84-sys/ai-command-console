import { apiError, apiSuccess } from "@/src/server/api/response";
import { evaluateRecommendationEffectivenessRequest, requireRecommendationEffectivenessUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationEffectivenessUser();
    return apiSuccess(await evaluateRecommendationEffectivenessRequest(request));
  } catch (error) {
    return apiError(error, "Unable to evaluate recommendation effectiveness.");
  }
}
