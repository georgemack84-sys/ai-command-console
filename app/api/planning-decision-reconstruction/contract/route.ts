import { apiError, apiSuccess } from "@/src/server/api/response";
import { getPlanningDecisionReconstructionContractResponse, requirePlanningDecisionReconstructionUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requirePlanningDecisionReconstructionUser(); return apiSuccess(getPlanningDecisionReconstructionContractResponse()); }
  catch (error) { return apiError(error, "Unable to load Planning & Decision Reconstruction contract."); }
}
