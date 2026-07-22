import { apiError, apiSuccess } from "@/src/server/api/response";
import { explainRequest, requireAssessmentReplayUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireAssessmentReplayUser(); return apiSuccess(await explainRequest(request)); }
  catch (error) { return apiError(error, "Unable to explain assessment replay."); }
}
