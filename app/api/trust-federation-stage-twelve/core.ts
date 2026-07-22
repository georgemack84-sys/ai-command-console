import { getTrustFederationStageTwelveBundle, runTrustFederationStageTwelve, validateTrustFederationStageTwelve } from "@/services/trust-federation-stage-twelve";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { TrustFederationInput, TrustFederationResult } from "@/types/trust-federation-stage-twelve";

export async function requireTrustFederationStageTwelveUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): TrustFederationInput { return body as TrustFederationInput; }
function resultFromBody(body: Record<string, unknown>): TrustFederationResult { return (body.result as TrustFederationResult | undefined) ?? runTrustFederationStageTwelve(inputFromBody(body)); }
export function contractResponse() { return getTrustFederationStageTwelveBundle(); }
export async function validateRequest(request: Request) { return validateTrustFederationStageTwelve(resultFromBody(await readBody(request))); }
export async function contractsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustFederationStageTwelve(); return { contracts: result.contracts }; }
export async function verificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustFederationStageTwelve(); return { verification: result.verification }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustFederationStageTwelve(); return { evidence: result.evidence }; }
export async function policiesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustFederationStageTwelve(); return { policies: result.policies }; }
export async function boundaryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustFederationStageTwelve(); return { boundary: result.boundary }; }
export async function monitoringRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustFederationStageTwelve(); return { monitoring: result.monitoring }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustFederationStageTwelve(); return { registry: result.registry }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustFederationStageTwelve(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
