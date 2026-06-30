import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRecommendationCertificationRequest, requireRecommendationCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRecommendationCertificationUser();
    return apiSuccess(await inspectRecommendationCertificationRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect recommendation certification.");
  }
}

export async function POST(request: Request) {
  try {
    await requireRecommendationCertificationUser();
    return apiSuccess(await inspectRecommendationCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect recommendation certification.");
  }
}
