import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireConstitutionalResilienceAssessmentUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireConstitutionalResilienceAssessmentUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect constitutional resilience assessment."); }
}
export async function POST(request: Request) {
  try { await requireConstitutionalResilienceAssessmentUser(); return apiSuccess(await inspectRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect constitutional resilience assessment."); }
}
