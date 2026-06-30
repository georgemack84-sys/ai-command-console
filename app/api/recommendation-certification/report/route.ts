import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportRecommendationCertificationRequest, requireRecommendationCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRecommendationCertificationUser();
    return apiSuccess(await reportRecommendationCertificationRequest());
  } catch (error) {
    return apiError(error, "Unable to report recommendation certification.");
  }
}

export async function POST(request: Request) {
  try {
    await requireRecommendationCertificationUser();
    return apiSuccess(await reportRecommendationCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to report recommendation certification.");
  }
}
