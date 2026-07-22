import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireMaturityDomainEvaluationUser, validateRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireMaturityDomainEvaluationUser(); return apiSuccess(await validateRequest(request)); }
  catch (error) { return apiError(error, "Unable to validate maturity domain evaluation."); }
}
