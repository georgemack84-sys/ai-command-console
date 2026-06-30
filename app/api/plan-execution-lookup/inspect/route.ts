import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectPlanExecutionLookupRequest, requirePlanExecutionLookupUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requirePlanExecutionLookupUser(); return apiSuccess(await inspectPlanExecutionLookupRequest()); }
  catch (error) { return apiError(error, "Unable to inspect Plan & Execution Lookup."); }
}
export async function POST(request: Request) {
  try { await requirePlanExecutionLookupUser(); return apiSuccess(await inspectPlanExecutionLookupRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect Plan & Execution Lookup."); }
}
