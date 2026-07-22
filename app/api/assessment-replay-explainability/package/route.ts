import { apiError, apiSuccess } from "@/src/server/api/response";
import { packageRequest, requireAssessmentReplayUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireAssessmentReplayUser(); return apiSuccess(await packageRequest(request)); }
  catch (error) { return apiError(error, "Unable to build replay certification package."); }
}
