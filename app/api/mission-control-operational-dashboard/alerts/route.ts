import { alertsRequest, requireMissionControlOperationalDashboardUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireMissionControlOperationalDashboardUser(); return apiSuccess(await alertsRequest(request)); }
  catch (error) { return apiError(error, "Unable to load operational alerts."); }
}
