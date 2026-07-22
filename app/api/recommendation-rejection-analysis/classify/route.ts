import { apiError, apiSuccess } from "@/src/server/api/response";
import { classifyRecommendationRejectionRequest, requireRecommendationRejectionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationRejectionUser();
    return apiSuccess(await classifyRecommendationRejectionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to classify recommendation rejection.");
  }
}
