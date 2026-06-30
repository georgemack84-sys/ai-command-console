import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceReplayRequest, requireSupervisionInterventionReplayUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireSupervisionInterventionReplayUser(); return apiSuccess(await governanceReplayRequest(request)); }
  catch (error) { return apiError(error, "Unable to replay supervision governance."); }
}
