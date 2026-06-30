import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireSupervisionInterventionBoundaryLookupUser, runSupervisionInterventionBoundaryLookupRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireSupervisionInterventionBoundaryLookupUser(); return apiSuccess(await runSupervisionInterventionBoundaryLookupRequest(request)); }
  catch (error) { return apiError(error, "Unable to run Supervision, Intervention & Boundary Lookup."); }
}
