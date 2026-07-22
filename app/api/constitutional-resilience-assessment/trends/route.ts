import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireConstitutionalResilienceAssessmentUser, trendsRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireConstitutionalResilienceAssessmentUser(); return apiSuccess(await trendsRequest(request)); }
  catch (error) { return apiError(error, "Unable to list constitutional resilience trends."); }
}
