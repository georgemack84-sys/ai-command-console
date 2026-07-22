import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireConstitutionalRecommendationUser, suppressedRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireConstitutionalRecommendationUser(); return apiSuccess(await suppressedRequest(request)); }
  catch (error) { return apiError(error, "Unable to list suppressed constitutional recommendations."); }
}
