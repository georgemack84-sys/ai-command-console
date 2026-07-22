import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireStrategyReplayExplainabilityUser, traceRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireStrategyReplayExplainabilityUser();
    return apiSuccess(await traceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve strategy replay decision trace.");
  }
}
