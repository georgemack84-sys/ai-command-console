import { apiError, apiSuccess } from "@/src/server/api/response";
import { generateRecommendationPathsRequest, requireRecommendationPathsUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationPathsUser();
    return apiSuccess(await generateRecommendationPathsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to generate alternative governance paths.");
  }
}
