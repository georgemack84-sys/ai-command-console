import { apiError, apiSuccess } from "@/src/server/api/response";
import { getPlanExecutionLookupContractResponse, requirePlanExecutionLookupUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requirePlanExecutionLookupUser(); return apiSuccess(getPlanExecutionLookupContractResponse()); }
  catch (error) { return apiError(error, "Unable to load Plan & Execution Lookup contract."); }
}
