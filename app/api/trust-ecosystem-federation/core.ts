import { getTrustEcosystemFederationBundle, runTrustEcosystemFederation, validateTrustEcosystemFederation } from "@/services/trust-ecosystem-federation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { TrustFederationInput, TrustFederationResult } from "@/types/trust-ecosystem-federation";

export async function requireTrustFederationUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): TrustFederationInput { return body as TrustFederationInput; }
function resultFromBody(body: Record<string, unknown>): TrustFederationResult { return (body.result as TrustFederationResult | undefined) ?? runTrustEcosystemFederation(inputFromBody(body)); }
export function contractResponse() { return getTrustEcosystemFederationBundle(); }
export async function validateRequest(request: Request) { return validateTrustEcosystemFederation(resultFromBody(await readBody(request))); }
export async function identityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustEcosystemFederation(); return { identity: result.identity }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustEcosystemFederation(); return { record: result.record }; }
export async function matrixRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustEcosystemFederation(); return { matrix: result.matrix }; }
export async function evaluationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustEcosystemFederation(); return { evaluation: result.evaluation }; }
export async function interoperabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustEcosystemFederation(); return { compatibility: result.compatibility }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustEcosystemFederation(); return { governance: result.governance }; }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustEcosystemFederation(); return { lineage: result.lineage }; }
export async function invalidationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustEcosystemFederation(); return { invalidation: result.invalidation }; }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustEcosystemFederation(); return { lifecycle: result.lifecycle }; }
export async function observabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustEcosystemFederation(); return { observability: result.observability }; }
export async function auditRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustEcosystemFederation(); return { audit: result.audit }; }
export async function securityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustEcosystemFederation(); return { security: result.security }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustEcosystemFederation(); return { certification: result.certification, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
