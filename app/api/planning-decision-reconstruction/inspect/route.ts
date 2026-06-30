import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectPlanningDecisionReconstructionRequest, requirePlanningDecisionReconstructionUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requirePlanningDecisionReconstructionUser(); return apiSuccess(await inspectPlanningDecisionReconstructionRequest()); }
  catch (error) { return apiError(error, "Unable to inspect planning and decision reconstruction."); }
}
export async function POST(request: Request) {
  try { await requirePlanningDecisionReconstructionUser(); return apiSuccess(await inspectPlanningDecisionReconstructionRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect planning and decision reconstruction."); }
}
