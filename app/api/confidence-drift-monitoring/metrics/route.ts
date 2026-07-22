import { apiError, apiSuccess } from "@/src/server/api/response";
import { metricsRequest, requireConfidenceDriftMonitoringUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireConfidenceDriftMonitoringUser();
    return apiSuccess(await metricsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve confidence drift metrics.");
  }
}
