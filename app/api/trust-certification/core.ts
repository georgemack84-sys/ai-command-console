import { getTrustCertificationBundle, runTrustCertification, validateTrustCertification } from "@/services/trust-certification";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { TrustCertificationInput, TrustCertificationResult } from "@/types/trust-certification";

export async function requireTrustCertificationUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): TrustCertificationInput { return body as TrustCertificationInput; }
function resultFromBody(body: Record<string, unknown>): TrustCertificationResult { return (body.result as TrustCertificationResult | undefined) ?? runTrustCertification(inputFromBody(body)); }
export function contractResponse() { return getTrustCertificationBundle(); }
export async function validateRequest(request: Request) { return validateTrustCertification(resultFromBody(await readBody(request))); }
export async function scopeRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustCertification(); return { scope: result.scope }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustCertification(); return { evidence: result.evidence }; }
export async function evaluationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustCertification(); return { evaluation: result.evaluation }; }
export async function attestationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustCertification(); return { attestation: result.attestation }; }
export async function certificateRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustCertification(); return { certificate: result.certificate }; }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustCertification(); return { lifecycle: result.lifecycle }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustCertification(); return { governance: result.governance }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustCertification(); return { replay: result.replay, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
export async function observabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustCertification(); return { observability: result.observability }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustCertification(); return { registry: result.registry }; }
export async function decisionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustCertification(); return { decision: result.certificate.certification_decision, report: result.report, boundary: result.boundary }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustCertification(); return { certification: result.certification, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
