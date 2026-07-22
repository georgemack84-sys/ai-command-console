import { apiError, apiSuccess } from "@/src/server/api/response";
import { analyzeRequest, readinessBundleResponse, requireReadinessGapUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireReadinessGapUser(); return apiSuccess(readinessBundleResponse()); }
  catch (error) { return apiError(error, "Unable to load readiness gap analysis engine."); }
}
export async function POST(request: Request) {
  try { await requireReadinessGapUser(); return apiSuccess(await analyzeRequest(request)); }
  catch (error) { return apiError(error, "Unable to analyze readiness gaps."); }
}
