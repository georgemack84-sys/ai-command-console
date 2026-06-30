import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRecommendationCertificationUser, validateRecommendationCertificationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationCertificationUser();
    return apiSuccess(await validateRecommendationCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate recommendation certification.");
  }
}
