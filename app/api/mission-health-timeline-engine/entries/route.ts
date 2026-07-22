import { apiError, apiSuccess } from "@/src/server/api/response";
import { entriesRequest, requireMissionHealthTimelineUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMissionHealthTimelineUser();
    return apiSuccess(await entriesRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load mission health timeline entries.");
  }
}
