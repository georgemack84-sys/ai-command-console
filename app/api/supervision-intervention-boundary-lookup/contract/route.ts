import { apiError, apiSuccess } from "@/src/server/api/response";
import { getSupervisionInterventionBoundaryLookupContractResponse, requireSupervisionInterventionBoundaryLookupUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireSupervisionInterventionBoundaryLookupUser(); return apiSuccess(getSupervisionInterventionBoundaryLookupContractResponse()); }
  catch (error) { return apiError(error, "Unable to load Supervision, Intervention & Boundary Lookup contract."); }
}
