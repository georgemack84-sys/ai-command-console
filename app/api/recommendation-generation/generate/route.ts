import { apiError, apiSuccess } from "@/src/server/api/response";
import { generateRecommendationsRequest, requireRecommendationGenerationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationGenerationUser();
    return apiSuccess(await generateRecommendationsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to generate recommendations.");
  }
}
