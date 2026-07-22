import { getOperatorConsoleBundle, runOperatorConsole, validateOperatorConsole } from "@/services/operator-console";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { OperatorConsoleInput, OperatorConsoleResult } from "@/types/operator-console";

export async function requireOperatorConsoleUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): OperatorConsoleInput { return body as OperatorConsoleInput; }
function resultFromBody(body: Record<string, unknown>): OperatorConsoleResult { return (body.result as OperatorConsoleResult | undefined) ?? runOperatorConsole(inputFromBody(body)); }
export function contractResponse() { return getOperatorConsoleBundle(); }
export async function validateRequest(request: Request) { return validateOperatorConsole(resultFromBody(await readBody(request))); }
export async function consoleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperatorConsole(); return { console: result.console }; }
export async function dashboardRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperatorConsole(); return { dashboard: result.dashboard }; }
export async function approvalsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperatorConsole(); return { approval_queue: result.approval_queue }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperatorConsole(); return { evidence_explorer: result.evidence_explorer, evidence: result.evidence }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperatorConsole(); return { replay_explorer: result.replay_explorer }; }
export async function certificationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperatorConsole(); return { certification_explorer: result.certification_explorer }; }
export async function emergencyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperatorConsole(); return { emergency_controls: result.emergency_controls }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperatorConsole(); return { governance_views: result.governance_views }; }
export async function notificationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperatorConsole(); return { notifications: result.notifications }; }
export async function workspacesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperatorConsole(); return { workspaces: result.workspaces }; }
export async function securityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperatorConsole(); return { security: result.security }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperatorConsole(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
