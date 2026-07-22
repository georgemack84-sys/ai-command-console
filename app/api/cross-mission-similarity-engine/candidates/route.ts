import { apiError, apiSuccess } from "@/src/server/api/response";
import { candidatesRequest, requireCrossMissionSimilarityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireCrossMissionSimilarityUser();
    return apiSuccess(await candidatesRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve cross-mission candidates.");
  }
}
