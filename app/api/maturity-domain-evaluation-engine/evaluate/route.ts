import { apiError, apiSuccess } from "@/src/server/api/response";
import { engineBundleResponse, evaluateRequest, requireMaturityDomainEvaluationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireMaturityDomainEvaluationUser(); return apiSuccess(engineBundleResponse()); }
  catch (error) { return apiError(error, "Unable to load maturity domain evaluation engine."); }
}
export async function POST(request: Request) {
  try { await requireMaturityDomainEvaluationUser(); return apiSuccess(await evaluateRequest(request)); }
  catch (error) { return apiError(error, "Unable to evaluate maturity domains."); }
}
