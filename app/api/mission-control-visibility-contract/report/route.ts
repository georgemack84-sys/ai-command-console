import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportMissionControlVisibilityRequest, requireMissionControlVisibilityUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireMissionControlVisibilityUser(); return apiSuccess(await reportMissionControlVisibilityRequest(request)); }
  catch (error) { return apiError(error, "Unable to build Mission Control Visibility Contract report."); }
}
