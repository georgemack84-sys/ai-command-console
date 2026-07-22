import { getTrustRegistryDomainsBundle, runTrustRegistryDomains, validateTrustRegistryDomains } from "@/services/trust-registry-domains";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { TrustRegistryDomainsInput, TrustRegistryDomainsResult } from "@/types/trust-registry-domains";

export async function requireTrustRegistryDomainsUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): TrustRegistryDomainsInput { return body as TrustRegistryDomainsInput; }
function resultFromBody(body: Record<string, unknown>): TrustRegistryDomainsResult { return (body.result as TrustRegistryDomainsResult | undefined) ?? runTrustRegistryDomains(inputFromBody(body)); }
export function contractResponse() { return getTrustRegistryDomainsBundle(); }
export async function validateRequest(request: Request) { return validateTrustRegistryDomains(resultFromBody(await readBody(request))); }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRegistryDomains(); return { registry: result.registry }; }
export async function domainsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRegistryDomains(); return { domains: result.domains }; }
export async function relationshipsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRegistryDomains(); return { relationships: result.relationships }; }
export async function boundariesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRegistryDomains(); return { boundaries: result.boundaries }; }
export async function policiesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRegistryDomains(); return { policies: result.policies }; }
export async function metadataRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRegistryDomains(); return { metadata: result.metadata }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRegistryDomains(); return { governance: result.governance }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRegistryDomains(); return { evidence: result.evidence }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRegistryDomains(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
