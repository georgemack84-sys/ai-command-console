import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireDeterministicMaturityScoringUser, scoreRequest, scoringBundleResponse } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireDeterministicMaturityScoringUser(); return apiSuccess(scoringBundleResponse()); }
  catch (error) { return apiError(error, "Unable to load deterministic maturity scoring engine."); }
}
export async function POST(request: Request) {
  try { await requireDeterministicMaturityScoringUser(); return apiSuccess(await scoreRequest(request)); }
  catch (error) { return apiError(error, "Unable to score maturity deterministically."); }
}
