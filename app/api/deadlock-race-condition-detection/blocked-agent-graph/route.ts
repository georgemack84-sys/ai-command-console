import { apiError, apiSuccess } from "@/src/server/api/response";
import { blockedAgentGraphRequest, requireDeadlockRaceUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireDeadlockRaceUser(); return apiSuccess(await blockedAgentGraphRequest(request)); }
  catch (error) { return apiError(error, "Unable to generate blocked-agent graph."); }
}
