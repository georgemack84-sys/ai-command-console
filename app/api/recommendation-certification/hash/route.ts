import { apiError, apiSuccess } from "@/src/server/api/response";
import { hashRecommendationCertificationRequest, requireRecommendationCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationCertificationUser();
    return apiSuccess(await hashRecommendationCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to hash recommendation certification.");
  }
}
