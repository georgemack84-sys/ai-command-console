import { apiError, apiSuccess } from "@/src/server/api/response";
import { getTruthDashboardRecordsForRequest, requireTruthDashboardUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireTruthDashboardUser();
    return apiSuccess(getTruthDashboardRecordsForRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load Truth Dashboard records.");
  }
}
