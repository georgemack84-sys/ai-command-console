import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePatternReplayUser, timelinePatternReplayRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternReplayUser();
    return apiSuccess(await timelinePatternReplayRequest(request));
  } catch (error) {
    return apiError(error, "Unable to reconstruct pattern replay timeline.");
  }
}
