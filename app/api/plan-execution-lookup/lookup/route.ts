import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePlanExecutionLookupUser, runPlanExecutionLookupRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requirePlanExecutionLookupUser(); return apiSuccess(await runPlanExecutionLookupRequest(request)); }
  catch (error) { return apiError(error, "Unable to run Plan & Execution Lookup."); }
}
