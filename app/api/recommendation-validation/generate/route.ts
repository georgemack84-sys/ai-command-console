import { apiError, apiSuccess } from "@/src/server/api/response";
import { generateRecommendationValidationRequest, requireRecommendationValidationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationValidationUser();
    return apiSuccess(await generateRecommendationValidationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to generate recommendation validation.");
  }
}
