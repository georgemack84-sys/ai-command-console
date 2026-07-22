import { apiError, apiSuccess } from "@/src/server/api/response";
import { confidenceHistoryRequest, requireMissionHealthTimelineUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMissionHealthTimelineUser();
    return apiSuccess(await confidenceHistoryRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load mission confidence history.");
  }
}
