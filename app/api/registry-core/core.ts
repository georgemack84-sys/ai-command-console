import { getRegistryCoreBundle, runRegistryCore, validateRegistryCore } from "@/services/registry-core";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { RegistryCoreInput, RegistryCoreResult } from "@/types/registry-core";

export async function requireRegistryCoreUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): RegistryCoreInput { return body as RegistryCoreInput; }
function resultFromBody(body: Record<string, unknown>): RegistryCoreResult { return (body.result as RegistryCoreResult | undefined) ?? runRegistryCore(inputFromBody(body)); }
export function contractResponse() { return getRegistryCoreBundle(); }
export async function validateRequest(request: Request) { return validateRegistryCore(resultFromBody(await readBody(request))); }
export async function architectureRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRegistryCore(); return { architecture: result.architecture }; }
export async function persistenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRegistryCore(); return { persistence: result.persistence }; }
export async function registrationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRegistryCore(); return { registration_engine: result.registration_engine }; }
export async function queryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRegistryCore(); return { query_engine: result.query_engine }; }
export async function ownershipRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRegistryCore(); return { ownership_registry: result.ownership_registry }; }
export async function dependenciesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRegistryCore(); return { dependency_registry: result.dependency_registry }; }
export async function contractsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRegistryCore(); return { contract_registry: result.contract_registry }; }
export async function messagingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRegistryCore(); return { registry_messaging: result.registry_messaging }; }
export async function securityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRegistryCore(); return { security: result.security }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRegistryCore(); return { evidence: result.evidence }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRegistryCore(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
