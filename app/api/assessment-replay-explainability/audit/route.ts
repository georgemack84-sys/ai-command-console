import { apiError, apiSuccess } from "@/src/server/api/response";
import { auditRequest, requireAssessmentReplayUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireAssessmentReplayUser(); return apiSuccess(await auditRequest(request)); }
  catch (error) { return apiError(error, "Unable to build replay audit report."); }
}
