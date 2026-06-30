import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildReplayInvestigationWorkspaceObservabilitySurface,
  getReplayInvestigationWorkspaceContract,
  runReplayInvestigationWorkspace,
  validateReplayInvestigationWorkspace,
} from "@/services/mission-control-replay-investigation-workspace";
import type { ReplayInvestigationWorkspaceInput, ReplayInvestigationWorkspaceReport } from "@/types/mission-control-replay-investigation-workspace";

export async function requireReplayInvestigationWorkspaceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): ReplayInvestigationWorkspaceInput {
  return body as ReplayInvestigationWorkspaceInput;
}

function reportFromBody(body: Record<string, unknown>): ReplayInvestigationWorkspaceReport {
  return (body.report as ReplayInvestigationWorkspaceReport | undefined) ?? runReplayInvestigationWorkspace(inputFromBody(body));
}

export function getReplayInvestigationWorkspaceContractResponse() { return getReplayInvestigationWorkspaceContract(); }
export async function workspaceRequest(request: Request) { return runReplayInvestigationWorkspace(inputFromBody(await readBody(request))); }
export async function validateWorkspaceRequest(request: Request) { return validateReplayInvestigationWorkspace(reportFromBody(await readBody(request))); }
export async function replayRequest(request: Request) { return reportFromBody(await readBody(request)).replay_sessions; }
export async function integrityRequest(request: Request) { return reportFromBody(await readBody(request)).integrity_records; }
export async function lineageRequest(request: Request) { return reportFromBody(await readBody(request)).lineage_records; }
export async function timelineRequest(request: Request) { return reportFromBody(await readBody(request)).timeline; }
export async function consoleRequest(request: Request) { return reportFromBody(await readBody(request)).investigation_console; }
export async function comparisonsRequest(request: Request) { return reportFromBody(await readBody(request)).comparisons; }
export async function searchRequest(request: Request) { return reportFromBody(await readBody(request)).searches; }
export async function evidenceRequest(request: Request) { return reportFromBody(await readBody(request)).evidence_records; }
export async function auditRequest(request: Request) { return reportFromBody(await readBody(request)).audit_exports; }
export async function inspectWorkspaceRequest(request?: Request) {
  if (!request) return buildReplayInvestigationWorkspaceObservabilitySurface();
  return buildReplayInvestigationWorkspaceObservabilitySurface(reportFromBody(await readBody(request)));
}
