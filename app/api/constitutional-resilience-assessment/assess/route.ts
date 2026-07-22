import { apiError, apiSuccess } from "@/src/server/api/response";
import { assessRequest, contractResponse, requireConstitutionalResilienceAssessmentUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireConstitutionalResilienceAssessmentUser(); return apiSuccess(contractResponse()); }
  catch (error) { return apiError(error, "Unable to load constitutional resilience assessment engine."); }
}
export async function POST(request: Request) {
  try { await requireConstitutionalResilienceAssessmentUser(); return apiSuccess(await assessRequest(request)); }
  catch (error) { return apiError(error, "Unable to assess constitutional resilience."); }
}
