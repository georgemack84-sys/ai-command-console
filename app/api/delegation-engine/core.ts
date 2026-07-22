import { getDelegationEngineBundle, runDelegationEngine, validateDelegationEngine } from "@/services/delegation-engine";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { DelegationEngineInput, DelegationEngineResult } from "@/types/delegation-engine";

export async function requireDelegationEngineUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): DelegationEngineInput { return body as DelegationEngineInput; }
function resultFromBody(body: Record<string, unknown>): DelegationEngineResult { return (body.result as DelegationEngineResult | undefined) ?? runDelegationEngine(inputFromBody(body)); }
export function contractResponse() { return getDelegationEngineBundle(); }
export async function validateRequest(request: Request) { return validateDelegationEngine(resultFromBody(await readBody(request))); }
export async function contractsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDelegationEngine(); return { contracts: result.contracts }; }
export async function authorityIntersectionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDelegationEngine(); return { authority_intersection: result.authority_intersection }; }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDelegationEngine(); return { lifecycle: result.lifecycle }; }
export async function revocationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDelegationEngine(); return { revocation: result.revocation }; }
export async function monitoringRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDelegationEngine(); return { monitoring: result.monitoring }; }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDelegationEngine(); return { lineage: result.lineage }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDelegationEngine(); return { governance: result.governance }; }
export async function runtimeIntegrationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDelegationEngine(); return { runtime_integration: result.runtime_integration }; }
export async function apisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDelegationEngine(); return { apis: result.apis }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDelegationEngine(); return { evidence: result.evidence }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDelegationEngine(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
