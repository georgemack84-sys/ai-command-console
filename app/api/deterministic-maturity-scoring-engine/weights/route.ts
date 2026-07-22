import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireDeterministicMaturityScoringUser, weightsRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireDeterministicMaturityScoringUser(); return apiSuccess(await weightsRequest(request)); }
  catch (error) { return apiError(error, "Unable to load maturity weighting profile."); }
}
