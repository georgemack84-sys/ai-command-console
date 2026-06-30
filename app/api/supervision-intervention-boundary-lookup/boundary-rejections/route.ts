import { apiError, apiSuccess } from "@/src/server/api/response";
import { boundaryRejectionLookupRequest, requireSupervisionInterventionBoundaryLookupUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireSupervisionInterventionBoundaryLookupUser(); return apiSuccess(await boundaryRejectionLookupRequest(request)); }
  catch (error) { return apiError(error, "Unable to load boundary rejection view."); }
}
