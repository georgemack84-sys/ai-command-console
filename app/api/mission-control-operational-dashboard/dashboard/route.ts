import { apiError, apiSuccess } from "@/src/server/api/response";
import { dashboardRequest, requireMissionControlOperationalDashboardUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireMissionControlOperationalDashboardUser(); return apiSuccess(await dashboardRequest(request)); }
  catch (error) { return apiError(error, "Unable to build Mission Control Operational Dashboard."); }
}
