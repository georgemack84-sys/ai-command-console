import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePatternReplayUser, verifyPatternReplayRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternReplayUser();
    return apiSuccess(await verifyPatternReplayRequest(request));
  } catch (error) {
    return apiError(error, "Unable to verify pattern replay.");
  }
}
