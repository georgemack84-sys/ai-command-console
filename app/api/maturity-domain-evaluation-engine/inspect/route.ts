import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireMaturityDomainEvaluationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireMaturityDomainEvaluationUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect maturity domain evaluation engine."); }
}
export async function POST(request: Request) {
  try { await requireMaturityDomainEvaluationUser(); return apiSuccess(await inspectRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect maturity domain evaluation engine."); }
}
