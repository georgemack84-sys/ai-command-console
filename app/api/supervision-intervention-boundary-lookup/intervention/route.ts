import { apiError, apiSuccess } from "@/src/server/api/response";
import { interventionLookupRequest, requireSupervisionInterventionBoundaryLookupUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireSupervisionInterventionBoundaryLookupUser(); return apiSuccess(await interventionLookupRequest(request)); }
  catch (error) { return apiError(error, "Unable to load intervention recommendations."); }
}
