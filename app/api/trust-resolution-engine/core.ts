import { getTrustResolutionEngineBundle, runTrustResolutionEngine, validateTrustResolutionEngine } from "@/services/trust-resolution-engine";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { TrustResolutionInput, TrustResolutionResult } from "@/types/trust-resolution-engine";

export async function requireTrustResolutionEngineUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): TrustResolutionInput { return body as TrustResolutionInput; }
function resultFromBody(body: Record<string, unknown>): TrustResolutionResult { return (body.result as TrustResolutionResult | undefined) ?? runTrustResolutionEngine(inputFromBody(body)); }
export function contractResponse() { return getTrustResolutionEngineBundle(); }
export async function validateRequest(request: Request) { return validateTrustResolutionEngine(resultFromBody(await readBody(request))); }
export async function rulesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustResolutionEngine(); return { rules: result.rules }; }
export async function compositionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustResolutionEngine(); return { composition: result.composition }; }
export async function standingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustResolutionEngine(); return { standing: result.standing }; }
export async function restrictionsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustResolutionEngine(); return { restrictions: result.restrictions }; }
export async function escalationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustResolutionEngine(); return { escalation: result.escalation }; }
export async function finalRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustResolutionEngine(); return { final: result.final }; }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustResolutionEngine(); return { lineage: result.lineage }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustResolutionEngine(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
