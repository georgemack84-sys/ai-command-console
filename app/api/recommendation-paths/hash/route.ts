import { apiError, apiSuccess } from "@/src/server/api/response";
import { hashRecommendationPathsRequest, requireRecommendationPathsUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationPathsUser();
    return apiSuccess(await hashRecommendationPathsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to hash alternative governance paths.");
  }
}
