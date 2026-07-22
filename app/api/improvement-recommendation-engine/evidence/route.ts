import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceRequest, requireImprovementRecommendationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireImprovementRecommendationUser(); return apiSuccess(await evidenceRequest(request)); }
  catch (error) { return apiError(error, "Unable to list recommendation evidence chains."); }
}
