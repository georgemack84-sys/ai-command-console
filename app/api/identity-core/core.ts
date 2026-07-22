import { getIdentityCoreBundle, runIdentityCore, validateIdentityCore } from "@/services/identity-core";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { IdentityCoreInput, IdentityCoreResult } from "@/types/identity-core";

export async function requireIdentityCoreUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): IdentityCoreInput { return body as IdentityCoreInput; }
function resultFromBody(body: Record<string, unknown>): IdentityCoreResult { return (body.result as IdentityCoreResult | undefined) ?? runIdentityCore(inputFromBody(body)); }
export function contractResponse() { return getIdentityCoreBundle(); }
export async function validateRequest(request: Request) { return validateIdentityCore(resultFromBody(await readBody(request))); }
export async function foundationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runIdentityCore(); return { foundation: result.foundation }; }
export async function transferRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runIdentityCore(); return { authority_transfer: result.authority_transfer }; }
export async function platformRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runIdentityCore(); return { platform_identity: result.platform_identity }; }
export async function tenantsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runIdentityCore(); return { tenant_registry: result.tenant_registry }; }
export async function namespacesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runIdentityCore(); return { namespace_registry: result.namespace_registry }; }
export async function authenticationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runIdentityCore(); return { authentication_service: result.authentication_service }; }
export async function authorizationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runIdentityCore(); return { authorization_service: result.authorization_service }; }
export async function tokensRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runIdentityCore(); return { token_service: result.token_service }; }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runIdentityCore(); return { lifecycle: result.lifecycle }; }
export async function auditRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runIdentityCore(); return { audit_evidence: result.audit_evidence }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runIdentityCore(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
