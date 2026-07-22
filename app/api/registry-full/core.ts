import { getRegistryFullBundle, runRegistryFull, validateRegistryFull } from "@/services/registry-full";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { RegistryFullInput, RegistryFullResult } from "@/types/registry-full";

export async function requireRegistryFullUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): RegistryFullInput { return body as RegistryFullInput; }
function resultFromBody(body: Record<string, unknown>): RegistryFullResult { return (body.result as RegistryFullResult | undefined) ?? runRegistryFull(inputFromBody(body)); }
export function contractResponse() { return getRegistryFullBundle(); }
export async function validateRequest(request: Request) { return validateRegistryFull(resultFromBody(await readBody(request))); }
export async function explorerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRegistryFull(); return { explorer: result.explorer }; }
export async function searchRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRegistryFull(); return { search: result.search }; }
export async function dependencyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRegistryFull(); return { dependency_intelligence: result.dependency_intelligence }; }
export async function compatibilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRegistryFull(); return { compatibility: result.compatibility }; }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRegistryFull(); return { lineage: result.lineage }; }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRegistryFull(); return { lifecycle_governance: result.lifecycle_governance }; }
export async function contractValidationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRegistryFull(); return { contract_validation: result.contract_validation }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRegistryFull(); return { evidence: result.evidence }; }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRegistryFull(); return { qualification: result.qualification }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRegistryFull(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
