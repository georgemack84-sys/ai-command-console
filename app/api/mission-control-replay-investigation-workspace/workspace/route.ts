import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireReplayInvestigationWorkspaceUser, workspaceRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireReplayInvestigationWorkspaceUser(); return apiSuccess(await workspaceRequest(request)); }
  catch (error) { return apiError(error, "Unable to build Replay Investigation Workspace."); }
}
