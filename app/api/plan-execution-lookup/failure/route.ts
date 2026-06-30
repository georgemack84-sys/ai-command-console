import { apiError, apiSuccess } from "@/src/server/api/response";
import { failureLookupRequest, requirePlanExecutionLookupUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requirePlanExecutionLookupUser(); return apiSuccess(await failureLookupRequest(request)); }
  catch (error) { return apiError(error, "Unable to load failure inspection."); }
}
