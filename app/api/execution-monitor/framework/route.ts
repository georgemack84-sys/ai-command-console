import { apiError, apiSuccess } from "@/src/server/api/response";
import { getExecutionMonitorResponse, requireExecutionMonitorUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireExecutionMonitorUser();
    return apiSuccess(getExecutionMonitorResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve execution monitor framework.");
  }
}
