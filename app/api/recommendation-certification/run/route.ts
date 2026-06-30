import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRecommendationCertificationUser, runRecommendationCertificationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationCertificationUser();
    return apiSuccess(await runRecommendationCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to run recommendation certification.");
  }
}
