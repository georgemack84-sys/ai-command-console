import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidencePatternReplayRequest, requirePatternReplayUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternReplayUser();
    return apiSuccess(await evidencePatternReplayRequest(request));
  } catch (error) {
    return apiError(error, "Unable to navigate pattern replay evidence.");
  }
}
