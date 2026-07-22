import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireMissionHealthTimelineUser, trendHistoryRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMissionHealthTimelineUser();
    return apiSuccess(await trendHistoryRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load mission trend history.");
  }
}
