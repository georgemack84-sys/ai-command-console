import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireMissionHealthRecommendationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireMissionHealthRecommendationUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect mission health recommendations.");
  }
}

export async function POST(request: Request) {
  try {
    await requireMissionHealthRecommendationUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect mission health recommendations.");
  }
}
