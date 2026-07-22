import { getIdentityFullBundle, runIdentityFull, validateIdentityFull } from "@/services/identity-full";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { IdentityFullInput, IdentityFullResult } from "@/types/identity-full";

export async function requireIdentityFullUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): IdentityFullInput { return body as IdentityFullInput; }
function resultFromBody(body: Record<string, unknown>): IdentityFullResult { return (body.result as IdentityFullResult | undefined) ?? runIdentityFull(inputFromBody(body)); }
export function contractResponse() { return getIdentityFullBundle(); }
export async function validateRequest(request: Request) { return validateIdentityFull(resultFromBody(await readBody(request))); }
export async function sessionsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runIdentityFull(); return { sessions: result.sessions }; }
export async function credentialsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runIdentityFull(); return { credentials: result.credentials }; }
export async function recoveryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runIdentityFull(); return { recovery: result.recovery }; }
export async function suspensionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runIdentityFull(); return { suspension: result.suspension }; }
export async function delegationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runIdentityFull(); return { delegation: result.delegation }; }
export async function federationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runIdentityFull(); return { federation: result.federation }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runIdentityFull(); return { evidence: result.evidence }; }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runIdentityFull(); return { qualification: result.qualification }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runIdentityFull(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
