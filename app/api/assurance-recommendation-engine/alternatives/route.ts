import { apiError, apiSuccess } from "@/src/server/api/response";
import { alternativesRequest, requireAssuranceRecommendationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAssuranceRecommendationUser();
    return apiSuccess(await alternativesRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load assurance recommendation alternatives.");
  }
}
