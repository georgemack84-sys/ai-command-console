import { apiError, apiSuccess } from "@/src/server/api/response";
import { monitorExecutionRequest, requireExecutionMonitorUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireExecutionMonitorUser();
    return apiSuccess(await monitorExecutionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build execution monitor.");
  }
}
