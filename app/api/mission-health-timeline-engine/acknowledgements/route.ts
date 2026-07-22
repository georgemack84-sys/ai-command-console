import { acknowledgementsRequest, requireMissionHealthTimelineUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMissionHealthTimelineUser();
    return apiSuccess(await acknowledgementsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load mission operator acknowledgements.");
  }
}
