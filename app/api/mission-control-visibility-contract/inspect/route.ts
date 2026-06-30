import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectMissionControlVisibilityRequest, requireMissionControlVisibilityUser, validateMissionControlVisibilityRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireMissionControlVisibilityUser(); return apiSuccess(await inspectMissionControlVisibilityRequest()); }
  catch (error) { return apiError(error, "Unable to inspect Mission Control Visibility Contract."); }
}
export async function POST(request: Request) {
  try { await requireMissionControlVisibilityUser(); return apiSuccess({ validation: await validateMissionControlVisibilityRequest(request), observability: await inspectMissionControlVisibilityRequest(request) }); }
  catch (error) { return apiError(error, "Unable to inspect Mission Control Visibility Contract."); }
}
