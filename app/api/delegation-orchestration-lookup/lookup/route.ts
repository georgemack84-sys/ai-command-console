import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireDelegationOrchestrationLookupUser, runDelegationOrchestrationLookupRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireDelegationOrchestrationLookupUser(); return apiSuccess(await runDelegationOrchestrationLookupRequest(request)); }
  catch (error) { return apiError(error, "Unable to run Delegation & Orchestration Lookup."); }
}
