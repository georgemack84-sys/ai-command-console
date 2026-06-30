import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePlanExecutionLookupUser, timelineLookupRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requirePlanExecutionLookupUser(); return apiSuccess(await timelineLookupRequest(request)); }
  catch (error) { return apiError(error, "Unable to load execution timeline."); }
}
