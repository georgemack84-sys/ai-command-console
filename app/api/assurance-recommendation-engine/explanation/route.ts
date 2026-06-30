import { apiError, apiSuccess } from "@/src/server/api/response";
import { explanationRequest, requireAssuranceRecommendationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAssuranceRecommendationUser();
    return apiSuccess(await explanationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to explain assurance recommendation.");
  }
}
