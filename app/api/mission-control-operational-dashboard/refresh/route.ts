import { apiError, apiSuccess } from "@/src/server/api/response";
import { refreshRequest, requireMissionControlOperationalDashboardUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireMissionControlOperationalDashboardUser(); return apiSuccess(await refreshRequest(request)); }
  catch (error) { return apiError(error, "Unable to load operational dashboard refresh record."); }
}
