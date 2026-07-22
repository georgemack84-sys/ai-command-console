import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRiskDriftMonitoringUser, timelineRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRiskDriftMonitoringUser();
    return apiSuccess(await timelineRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve escalation drift timeline.");
  }
}
