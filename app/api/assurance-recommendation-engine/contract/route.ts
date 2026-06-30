import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireAssuranceRecommendationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAssuranceRecommendationUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to load assurance recommendation contract.");
  }
}
