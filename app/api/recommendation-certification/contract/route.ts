import { apiError, apiSuccess } from "@/src/server/api/response";
import { getRecommendationCertificationContract, requireRecommendationCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRecommendationCertificationUser();
    return apiSuccess(getRecommendationCertificationContract());
  } catch (error) {
    return apiError(error, "Unable to load recommendation certification contract.");
  }
}
