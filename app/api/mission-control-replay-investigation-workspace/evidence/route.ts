import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceRequest, requireReplayInvestigationWorkspaceUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireReplayInvestigationWorkspaceUser(); return apiSuccess(await evidenceRequest(request)); }
  catch (error) { return apiError(error, "Unable to load investigation evidence."); }
}
