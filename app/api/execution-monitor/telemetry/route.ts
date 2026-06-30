import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireExecutionMonitorUser, telemetryExecutionMonitorRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireExecutionMonitorUser();
    return apiSuccess(await telemetryExecutionMonitorRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve execution telemetry.");
  }
}
