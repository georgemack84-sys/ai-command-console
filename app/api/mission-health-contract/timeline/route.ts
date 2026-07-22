import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireMissionHealthUser, timelineRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMissionHealthUser();
    return apiSuccess(await timelineRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load mission health timeline.");
  }
}
