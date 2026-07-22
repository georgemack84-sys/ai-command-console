import { apiError, apiSuccess } from "@/src/server/api/response";
import { explanationsRequest, requireConstitutionalResilienceAssessmentUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireConstitutionalResilienceAssessmentUser(); return apiSuccess(await explanationsRequest(request)); }
  catch (error) { return apiError(error, "Unable to explain constitutional resilience scores."); }
}
