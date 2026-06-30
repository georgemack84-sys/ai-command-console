import { apiError, apiSuccess } from "@/src/server/api/response";
import { interventionReplayRequest, requireSupervisionInterventionReplayUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireSupervisionInterventionReplayUser(); return apiSuccess(await interventionReplayRequest(request)); }
  catch (error) { return apiError(error, "Unable to replay intervention timeline."); }
}
