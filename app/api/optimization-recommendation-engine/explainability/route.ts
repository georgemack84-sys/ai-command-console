import { apiError, apiSuccess } from "@/src/server/api/response";
import { explainabilityRequest, requireOptimizationRecommendationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireOptimizationRecommendationUser(); return apiSuccess(await explainabilityRequest(request)); }
  catch (error) { return apiError(error, "Unable to load optimization recommendation explainability."); }
}
