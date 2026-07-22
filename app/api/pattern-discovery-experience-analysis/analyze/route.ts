import { apiError, apiSuccess } from "@/src/server/api/response";
import { analyzeRequest, contractResponse, requirePatternAnalysisUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requirePatternAnalysisUser(); return apiSuccess(contractResponse()); }
  catch (error) { return apiError(error, "Unable to load pattern discovery experience analysis engine."); }
}
export async function POST(request: Request) {
  try { await requirePatternAnalysisUser(); return apiSuccess(await analyzeRequest(request)); }
  catch (error) { return apiError(error, "Unable to analyze mission experience."); }
}
