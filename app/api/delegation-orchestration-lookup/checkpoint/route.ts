import { apiError, apiSuccess } from "@/src/server/api/response";
import { checkpointLookupRequest, requireDelegationOrchestrationLookupUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireDelegationOrchestrationLookupUser(); return apiSuccess(await checkpointLookupRequest(request)); }
  catch (error) { return apiError(error, "Unable to load checkpoint query records."); }
}
