import { apiError, apiSuccess } from "@/src/server/api/response";
import { prioritiesRequest, requireReadinessGapUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireReadinessGapUser(); return apiSuccess(await prioritiesRequest(request)); }
  catch (error) { return apiError(error, "Unable to list readiness improvement priorities."); }
}
