import { apiError, apiSuccess } from "@/src/server/api/response";
import { getDelegationOrchestrationLookupContractResponse, requireDelegationOrchestrationLookupUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireDelegationOrchestrationLookupUser(); return apiSuccess(getDelegationOrchestrationLookupContractResponse()); }
  catch (error) { return apiError(error, "Unable to load Delegation & Orchestration Lookup contract."); }
}
