import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireDelegationOrchestrationLookupUser, routingLookupRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireDelegationOrchestrationLookupUser(); return apiSuccess(await routingLookupRequest(request)); }
  catch (error) { return apiError(error, "Unable to load routing decision view."); }
}
