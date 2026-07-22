import { getAuthorityValidatorBundle, runAuthorityValidator, validateAuthorityValidator } from "@/services/authority-validator";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { AuthorityValidatorInput, AuthorityValidatorResult } from "@/types/authority-validator";

export async function requireAuthorityValidatorUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): AuthorityValidatorInput { return body as AuthorityValidatorInput; }
function resultFromBody(body: Record<string, unknown>): AuthorityValidatorResult { return (body.result as AuthorityValidatorResult | undefined) ?? runAuthorityValidator(inputFromBody(body)); }
export function contractResponse() { return getAuthorityValidatorBundle(); }
export async function validateRequest(request: Request) { return validateAuthorityValidator(resultFromBody(await readBody(request))); }
export async function profilesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAuthorityValidator(); return { profiles: result.profiles }; }
export async function delegationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAuthorityValidator(); return { delegation: result.delegation }; }
export async function evaluationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAuthorityValidator(); return { evaluation: result.evaluation }; }
export async function restrictionsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAuthorityValidator(); return { restrictions: result.restrictions }; }
export async function dispositionMappingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAuthorityValidator(); return { disposition_mapping: result.disposition_mapping }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAuthorityValidator(); return { registry: result.registry }; }
export async function decisionsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAuthorityValidator(); return { decisions: result.decisions }; }
export async function apisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAuthorityValidator(); return { apis: result.apis }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAuthorityValidator(); return { evidence: result.evidence }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAuthorityValidator(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
