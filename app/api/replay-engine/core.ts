import { getReplayEngineBundle, runReplayEngine, validateReplayEngine } from "@/services/replay-engine";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ReplayEngineInput, ReplayEngineResult } from "@/types/replay-engine";

export async function requireReplayEngineUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ReplayEngineInput { return body as ReplayEngineInput; }
function resultFromBody(body: Record<string, unknown>): ReplayEngineResult { return (body.result as ReplayEngineResult | undefined) ?? runReplayEngine(inputFromBody(body)); }
export function contractResponse() { return getReplayEngineBundle(); }
export async function validateRequest(request: Request) { return validateReplayEngine(resultFromBody(await readBody(request))); }
export async function runtimeReplayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runReplayEngine(); return { runtime_replay: result.runtime_replay }; }
export async function decisionReplayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runReplayEngine(); return { decision_replay: result.decision_replay }; }
export async function executionControlRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runReplayEngine(); return { execution_control: result.execution_control }; }
export async function divergenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runReplayEngine(); return { divergence_detection: result.divergence_detection }; }
export async function apisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runReplayEngine(); return { apis: result.apis }; }
export async function explorerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runReplayEngine(); return { explorer: result.explorer }; }
export async function reportsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runReplayEngine(); return { reports: result.reports }; }
export async function securityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runReplayEngine(); return { security: result.security }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runReplayEngine(); return { evidence: result.evidence }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runReplayEngine(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
