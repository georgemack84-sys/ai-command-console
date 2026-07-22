import { apiError, apiSuccess } from "@/src/server/api/response";
import { baselineRequest, requireConfidenceDriftMonitoringUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireConfidenceDriftMonitoringUser();
    return apiSuccess(await baselineRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve confidence baseline.");
  }
}
