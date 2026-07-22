import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, recommendRequest, requireOptimizationRecommendationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireOptimizationRecommendationUser(); return apiSuccess(contractResponse()); }
  catch (error) { return apiError(error, "Unable to load optimization recommendation engine."); }
}
export async function POST(request: Request) {
  try { await requireOptimizationRecommendationUser(); return apiSuccess(await recommendRequest(request)); }
  catch (error) { return apiError(error, "Unable to generate optimization recommendations."); }
}
