import { apiError, apiSuccess } from "@/src/server/api/response";
import { recordsRequest, requireStrategyReplayExplainabilityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireStrategyReplayExplainabilityUser();
    return apiSuccess(await recordsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve strategy replay records.");
  }
}
