import { apiError, apiSuccess } from "@/src/server/api/response";
import { delegationReplayRequest, requirePlanningDecisionReconstructionUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requirePlanningDecisionReconstructionUser(); return apiSuccess(await delegationReplayRequest(request)); }
  catch (error) { return apiError(error, "Unable to reconstruct delegation replay."); }
}
