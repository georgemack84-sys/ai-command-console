import { getTrustIdentityDomainsBoundariesBundle, runTrustIdentityDomainsBoundaries, validateTrustIdentityDomainsBoundaries } from "@/services/trust-identity-domains-boundaries";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { TrustIdentityDomainBoundaryInput, TrustIdentityDomainBoundaryResult } from "@/types/trust-identity-domains-boundaries";

export async function requireTrustIdentityDomainBoundaryUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): TrustIdentityDomainBoundaryInput { return body as TrustIdentityDomainBoundaryInput; }
function resultFromBody(body: Record<string, unknown>): TrustIdentityDomainBoundaryResult { return (body.result as TrustIdentityDomainBoundaryResult | undefined) ?? runTrustIdentityDomainsBoundaries(inputFromBody(body)); }
export function contractResponse() { return getTrustIdentityDomainsBoundariesBundle(); }
export async function validateRequest(request: Request) { return validateTrustIdentityDomainsBoundaries(resultFromBody(await readBody(request))); }
export async function identitiesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustIdentityDomainsBoundaries(); return { trust_registry: result.trust_registry }; }
export async function domainsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustIdentityDomainsBoundaries(); return { trust_domain_registry: result.trust_domain_registry }; }
export async function boundariesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustIdentityDomainsBoundaries(); return { trust_boundary_registry: result.trust_boundary_registry }; }
export async function isolationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustIdentityDomainsBoundaries(); return { tenant_isolation: result.tenant_isolation, resolution: result.resolution }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustIdentityDomainsBoundaries(); return { governance: result.governance }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustIdentityDomainsBoundaries(); return { evidence: result.evidence }; }
export async function securityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustIdentityDomainsBoundaries(); return { security: result.security, observability: result.observability }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustIdentityDomainsBoundaries(); return { certification: result.certification, integrity_hash: result.integrity_hash, replay_hash: result.replay_hash }; }
