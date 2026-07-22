import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireCrossMissionSimilarityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireCrossMissionSimilarityUser();
    return apiSuccess(await replayRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay cross-mission similarity engine.");
  }
}
