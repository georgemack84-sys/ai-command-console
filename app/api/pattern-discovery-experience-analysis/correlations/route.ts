import { apiError, apiSuccess } from "@/src/server/api/response";
import { correlationsRequest, requirePatternAnalysisUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requirePatternAnalysisUser(); return apiSuccess(await correlationsRequest(request)); }
  catch (error) { return apiError(error, "Unable to list experience correlations."); }
}
