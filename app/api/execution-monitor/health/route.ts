import { apiError, apiSuccess } from "@/src/server/api/response";
import { healthExecutionMonitorRequest, requireExecutionMonitorUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireExecutionMonitorUser();
    return apiSuccess(await healthExecutionMonitorRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve execution health metrics.");
  }
}
