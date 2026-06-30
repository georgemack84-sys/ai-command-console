import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireMissionControlOperationalDashboardUser, stateRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireMissionControlOperationalDashboardUser(); return apiSuccess(await stateRequest(request)); }
  catch (error) { return apiError(error, "Unable to load operational state monitor."); }
}
