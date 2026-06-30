import { apiError, apiSuccess } from "@/src/server/api/response";
import { dashboardsMissionControlVisibilityRequest, requireMissionControlVisibilityUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireMissionControlVisibilityUser(); return apiSuccess(await dashboardsMissionControlVisibilityRequest(request)); }
  catch (error) { return apiError(error, "Unable to load Mission Control dashboard contracts."); }
}
