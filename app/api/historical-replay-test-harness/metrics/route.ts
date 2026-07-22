import { apiError, apiSuccess } from "@/src/server/api/response";
import { metricsRequest, requireHistoricalReplayHarnessUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireHistoricalReplayHarnessUser();
    return apiSuccess(await metricsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve historical replay metrics.");
  }
}
