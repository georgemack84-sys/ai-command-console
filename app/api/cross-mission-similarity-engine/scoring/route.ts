import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireCrossMissionSimilarityUser, scoringRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireCrossMissionSimilarityUser();
    return apiSuccess(await scoringRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve cross-mission similarity scoring.");
  }
}
