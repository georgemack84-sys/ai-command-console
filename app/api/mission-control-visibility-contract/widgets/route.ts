import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireMissionControlVisibilityUser, widgetsMissionControlVisibilityRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireMissionControlVisibilityUser(); return apiSuccess(await widgetsMissionControlVisibilityRequest(request)); }
  catch (error) { return apiError(error, "Unable to load Mission Control widget registry."); }
}
