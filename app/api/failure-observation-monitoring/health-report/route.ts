import { apiError, apiSuccess } from "@/src/server/api/response";
import { healthReportRequest, requireFailureObservationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireFailureObservationUser();
    return apiSuccess(await healthReportRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build subsystem health report.");
  }
}
