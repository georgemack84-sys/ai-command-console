import { apiError, apiSuccess } from "@/src/server/api/response";
import { getReplayInvestigationWorkspaceContractResponse, requireReplayInvestigationWorkspaceUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireReplayInvestigationWorkspaceUser(); return apiSuccess(getReplayInvestigationWorkspaceContractResponse()); }
  catch (error) { return apiError(error, "Unable to load Replay Investigation Workspace contract."); }
}
