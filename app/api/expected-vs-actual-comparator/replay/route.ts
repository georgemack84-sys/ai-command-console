import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayExpectedVsActualRequest, requireExpectedVsActualComparatorUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireExpectedVsActualComparatorUser();
    return apiSuccess(await replayExpectedVsActualRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay expected vs actual comparison.");
  }
}
