import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireMissionControlOperationalDashboardUser, risksRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireMissionControlOperationalDashboardUser(); return apiSuccess(await risksRequest(request)); }
  catch (error) { return apiError(error, "Unable to load operational risk monitor."); }
}
