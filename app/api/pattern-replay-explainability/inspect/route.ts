import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectPatternReplayRequest, requirePatternReplayUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternReplayUser();
    return apiSuccess(await inspectPatternReplayRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect pattern replay explainability.");
  }
}
