import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireRiskDriftMonitoringUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRiskDriftMonitoringUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve risk drift monitoring contract.");
  }
}
