import { apiError, apiSuccess } from "@/src/server/api/response";
import { recommendRequest, recommendationBundleResponse, requireImprovementRecommendationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireImprovementRecommendationUser(); return apiSuccess(recommendationBundleResponse()); }
  catch (error) { return apiError(error, "Unable to load improvement recommendation engine."); }
}
export async function POST(request: Request) {
  try { await requireImprovementRecommendationUser(); return apiSuccess(await recommendRequest(request)); }
  catch (error) { return apiError(error, "Unable to generate improvement recommendations."); }
}
