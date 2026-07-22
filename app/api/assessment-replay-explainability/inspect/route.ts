import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireAssessmentReplayUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireAssessmentReplayUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect assessment replay explainability."); }
}
export async function POST(request: Request) {
  try { await requireAssessmentReplayUser(); return apiSuccess(await inspectRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect assessment replay explainability."); }
}
