import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRecommendationValidationRequest, requireRecommendationValidationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRecommendationValidationUser();
    return apiSuccess(await inspectRecommendationValidationRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect recommendation validation.");
  }
}

export async function POST(request: Request) {
  try {
    await requireRecommendationValidationUser();
    return apiSuccess(await inspectRecommendationValidationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect recommendation validation.");
  }
}
