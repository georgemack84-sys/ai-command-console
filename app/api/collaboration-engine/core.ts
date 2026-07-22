import { getCollaborationEngineBundle, runCollaborationEngine, validateCollaborationEngine } from "@/services/collaboration-engine";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { CollaborationEngineInput, CollaborationEngineResult } from "@/types/collaboration-engine";

export async function requireCollaborationEngineUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): CollaborationEngineInput { return body as CollaborationEngineInput; }
function resultFromBody(body: Record<string, unknown>): CollaborationEngineResult { return (body.result as CollaborationEngineResult | undefined) ?? runCollaborationEngine(inputFromBody(body)); }
export function contractResponse() { return getCollaborationEngineBundle(); }
export async function validateRequest(request: Request) { return validateCollaborationEngine(resultFromBody(await readBody(request))); }
export async function sessionsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCollaborationEngine(); return { sessions: result.sessions }; }
export async function sharedContextRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCollaborationEngine(); return { shared_context: result.shared_context }; }
export async function coordinationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCollaborationEngine(); return { coordination: result.coordination }; }
export async function conflictsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCollaborationEngine(); return { conflicts: result.conflicts }; }
export async function consensusRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCollaborationEngine(); return { consensus: result.consensus }; }
export async function arbitrationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCollaborationEngine(); return { arbitration: result.arbitration }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCollaborationEngine(); return { governance: result.governance }; }
export async function monitoringRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCollaborationEngine(); return { monitoring: result.monitoring }; }
export async function apisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCollaborationEngine(); return { apis: result.apis }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCollaborationEngine(); return { evidence: result.evidence }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCollaborationEngine(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
