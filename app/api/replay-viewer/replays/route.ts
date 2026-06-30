import { apiError, apiSuccess } from "@/src/server/api/response";
import { getReplayViewerRecordsForRequest, requireReplayViewerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireReplayViewerUser();
    return apiSuccess(getReplayViewerRecordsForRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load Replay Viewer records.");
  }
}
