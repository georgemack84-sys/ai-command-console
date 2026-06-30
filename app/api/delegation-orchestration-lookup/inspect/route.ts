import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectDelegationOrchestrationLookupRequest, requireDelegationOrchestrationLookupUser, validateDelegationOrchestrationLookupRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireDelegationOrchestrationLookupUser(); return apiSuccess(await inspectDelegationOrchestrationLookupRequest()); }
  catch (error) { return apiError(error, "Unable to inspect Delegation & Orchestration Lookup."); }
}
export async function POST(request: Request) {
  try { await requireDelegationOrchestrationLookupUser(); return apiSuccess({ validation: await validateDelegationOrchestrationLookupRequest(request), observability: await inspectDelegationOrchestrationLookupRequest(request) }); }
  catch (error) { return apiError(error, "Unable to validate Delegation & Orchestration Lookup."); }
}
