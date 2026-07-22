import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerRequest, requireOptimizationRecommendationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireOptimizationRecommendationUser(); return apiSuccess(await ledgerRequest(request)); }
  catch (error) { return apiError(error, "Unable to load optimization recommendation ledger."); }
}
