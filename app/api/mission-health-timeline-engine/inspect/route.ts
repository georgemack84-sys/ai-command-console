import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireMissionHealthTimelineUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireMissionHealthTimelineUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect mission health timeline.");
  }
}

export async function POST(request: Request) {
  try {
    await requireMissionHealthTimelineUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect mission health timeline.");
  }
}
