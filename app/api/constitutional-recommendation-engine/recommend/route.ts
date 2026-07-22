import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, recommendRequest, requireConstitutionalRecommendationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireConstitutionalRecommendationUser(); return apiSuccess(contractResponse()); }
  catch (error) { return apiError(error, "Unable to load constitutional recommendation engine."); }
}
export async function POST(request: Request) {
  try { await requireConstitutionalRecommendationUser(); return apiSuccess(await recommendRequest(request)); }
  catch (error) { return apiError(error, "Unable to generate constitutional recommendations."); }
}
