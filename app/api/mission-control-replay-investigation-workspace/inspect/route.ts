import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectWorkspaceRequest, requireReplayInvestigationWorkspaceUser, validateWorkspaceRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireReplayInvestigationWorkspaceUser(); return apiSuccess(await inspectWorkspaceRequest()); }
  catch (error) { return apiError(error, "Unable to inspect Replay Investigation Workspace."); }
}
export async function POST(request: Request) {
  try { await requireReplayInvestigationWorkspaceUser(); return apiSuccess({ validation: await validateWorkspaceRequest(request), observability: await inspectWorkspaceRequest(request) }); }
  catch (error) { return apiError(error, "Unable to inspect Replay Investigation Workspace."); }
}
