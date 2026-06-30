import { apiError, apiSuccess } from "@/src/server/api/response";
import { planningReplayRequest, requirePlanningDecisionReconstructionUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requirePlanningDecisionReconstructionUser(); return apiSuccess(await planningReplayRequest(request)); }
  catch (error) { return apiError(error, "Unable to reconstruct planning replay."); }
}
