import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectSupervisionInterventionBoundaryLookupRequest, requireSupervisionInterventionBoundaryLookupUser, validateSupervisionInterventionBoundaryLookupRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireSupervisionInterventionBoundaryLookupUser(); return apiSuccess(await inspectSupervisionInterventionBoundaryLookupRequest()); }
  catch (error) { return apiError(error, "Unable to inspect Supervision, Intervention & Boundary Lookup."); }
}
export async function POST(request: Request) {
  try { await requireSupervisionInterventionBoundaryLookupUser(); return apiSuccess({ validation: await validateSupervisionInterventionBoundaryLookupRequest(request), observability: await inspectSupervisionInterventionBoundaryLookupRequest(request) }); }
  catch (error) { return apiError(error, "Unable to validate Supervision, Intervention & Boundary Lookup."); }
}
