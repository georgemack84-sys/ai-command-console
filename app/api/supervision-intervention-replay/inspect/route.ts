import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectSupervisionInterventionReplayRequest, requireSupervisionInterventionReplayUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireSupervisionInterventionReplayUser(); return apiSuccess(await inspectSupervisionInterventionReplayRequest()); }
  catch (error) { return apiError(error, "Unable to inspect supervision intervention replay."); }
}
export async function POST(request: Request) {
  try { await requireSupervisionInterventionReplayUser(); return apiSuccess(await inspectSupervisionInterventionReplayRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect supervision intervention replay."); }
}
