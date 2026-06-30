import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireExecutionMonitorUser, validateExecutionMonitorRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireExecutionMonitorUser();
    return apiSuccess(await validateExecutionMonitorRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate execution monitor.");
  }
}
