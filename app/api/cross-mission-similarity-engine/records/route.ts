import { apiError, apiSuccess } from "@/src/server/api/response";
import { recordsRequest, requireCrossMissionSimilarityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireCrossMissionSimilarityUser();
    return apiSuccess(await recordsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve cross-mission similarity records.");
  }
}
