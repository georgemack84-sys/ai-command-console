import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRecommendationDimensionRequest, requireRecommendationDimensionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRecommendationDimensionUser();
    return apiSuccess(await inspectRecommendationDimensionRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect recommendation dimension evaluation.");
  }
}

export async function POST(request: Request) {
  try {
    await requireRecommendationDimensionUser();
    return apiSuccess(await inspectRecommendationDimensionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect recommendation dimension evaluation.");
  }
}
