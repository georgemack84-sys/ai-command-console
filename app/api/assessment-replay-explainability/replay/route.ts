import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayBundleResponse, replayRequest, requireAssessmentReplayUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireAssessmentReplayUser(); return apiSuccess(replayBundleResponse()); }
  catch (error) { return apiError(error, "Unable to load assessment replay explainability."); }
}
export async function POST(request: Request) {
  try { await requireAssessmentReplayUser(); return apiSuccess(await replayRequest(request)); }
  catch (error) { return apiError(error, "Unable to replay assessment."); }
}
