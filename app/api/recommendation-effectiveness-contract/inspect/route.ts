import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRecommendationEffectivenessRequest, requireRecommendationEffectivenessUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRecommendationEffectivenessUser();
    return apiSuccess(await inspectRecommendationEffectivenessRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect recommendation effectiveness.");
  }
}

export async function POST(request: Request) {
  try {
    await requireRecommendationEffectivenessUser();
    return apiSuccess(await inspectRecommendationEffectivenessRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect recommendation effectiveness.");
  }
}
