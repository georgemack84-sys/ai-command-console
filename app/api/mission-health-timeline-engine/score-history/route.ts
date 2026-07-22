import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireMissionHealthTimelineUser, scoreHistoryRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMissionHealthTimelineUser();
    return apiSuccess(await scoreHistoryRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load mission score history.");
  }
}
