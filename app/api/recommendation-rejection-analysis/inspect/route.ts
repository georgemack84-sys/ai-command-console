import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRecommendationRejectionRequest, requireRecommendationRejectionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRecommendationRejectionUser();
    return apiSuccess(await inspectRecommendationRejectionRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect recommendation rejection analysis.");
  }
}

export async function POST(request: Request) {
  try {
    await requireRecommendationRejectionUser();
    return apiSuccess(await inspectRecommendationRejectionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect recommendation rejection analysis.");
  }
}
