import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireMissionHealthRecommendationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireMissionHealthRecommendationUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to load mission health recommendation contract.");
  }
}
