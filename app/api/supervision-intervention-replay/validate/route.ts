import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireSupervisionInterventionReplayUser, validateSupervisionInterventionReplayRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireSupervisionInterventionReplayUser(); return apiSuccess(await validateSupervisionInterventionReplayRequest(request)); }
  catch (error) { return apiError(error, "Unable to validate supervision intervention replay."); }
}
