import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRecommendationPathsRequest, requireRecommendationPathsUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRecommendationPathsUser();
    return apiSuccess(await inspectRecommendationPathsRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect alternative governance paths.");
  }
}

export async function POST(request: Request) {
  try {
    await requireRecommendationPathsUser();
    return apiSuccess(await inspectRecommendationPathsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect alternative governance paths.");
  }
}
