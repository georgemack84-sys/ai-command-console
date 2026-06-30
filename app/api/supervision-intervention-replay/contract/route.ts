import { apiError, apiSuccess } from "@/src/server/api/response";
import { getSupervisionInterventionReplayContractResponse, requireSupervisionInterventionReplayUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireSupervisionInterventionReplayUser(); return apiSuccess(getSupervisionInterventionReplayContractResponse()); }
  catch (error) { return apiError(error, "Unable to load Supervision & Intervention Replay contract."); }
}
