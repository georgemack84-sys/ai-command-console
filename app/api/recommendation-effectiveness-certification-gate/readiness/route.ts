import { apiError, apiSuccess } from "@/src/server/api/response";
import { readinessRecommendationEffectivenessCertificationRequest, requireRecommendationEffectivenessCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationEffectivenessCertificationUser();
    return apiSuccess(await readinessRecommendationEffectivenessCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to certify recommendation effectiveness production readiness.");
  }
}
