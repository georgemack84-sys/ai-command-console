import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requirePatternAnalysisUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requirePatternAnalysisUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect pattern analysis."); }
}
export async function POST(request: Request) {
  try { await requirePatternAnalysisUser(); return apiSuccess(await inspectRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect pattern analysis."); }
}
