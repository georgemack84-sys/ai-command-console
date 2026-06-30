import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireMissionControlVisibilityUser, validateMissionControlVisibilityRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireMissionControlVisibilityUser(); return apiSuccess(await validateMissionControlVisibilityRequest(request)); }
  catch (error) { return apiError(error, "Unable to validate Mission Control Visibility Contract."); }
}
