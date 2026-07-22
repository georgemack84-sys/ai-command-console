import { apiError, apiSuccess } from "@/src/server/api/response";
import { priorityRequest, requireMissionHealthRecommendationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMissionHealthRecommendationUser();
    return apiSuccess(await priorityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load recommendation priorities.");
  }
}
