import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePlanningDecisionReconstructionUser, validatePlanningDecisionReconstructionRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requirePlanningDecisionReconstructionUser(); return apiSuccess(await validatePlanningDecisionReconstructionRequest(request)); }
  catch (error) { return apiError(error, "Unable to validate planning and decision reconstruction."); }
}
