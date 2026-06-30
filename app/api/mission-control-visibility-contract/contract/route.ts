import { apiError, apiSuccess } from "@/src/server/api/response";
import { getMissionControlVisibilityContractResponse, requireMissionControlVisibilityUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireMissionControlVisibilityUser(); return apiSuccess(getMissionControlVisibilityContractResponse()); }
  catch (error) { return apiError(error, "Unable to load Mission Control Visibility Contract."); }
}
