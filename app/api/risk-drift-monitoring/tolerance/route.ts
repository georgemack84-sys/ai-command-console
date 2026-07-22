import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRiskDriftMonitoringUser, toleranceRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRiskDriftMonitoringUser();
    return apiSuccess(await toleranceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve risk tolerance report.");
  }
}
