import { getTrustRecoveryRevocationBundle, runTrustRecoveryRevocation, validateTrustRecoveryRevocation } from "@/services/trust-recovery-revocation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { TrustRecoveryInput, TrustRecoveryResult } from "@/types/trust-recovery-revocation";

export async function requireTrustRecoveryUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): TrustRecoveryInput { return body as TrustRecoveryInput; }
function resultFromBody(body: Record<string, unknown>): TrustRecoveryResult { return (body.result as TrustRecoveryResult | undefined) ?? runTrustRecoveryRevocation(inputFromBody(body)); }
export function contractResponse() { return getTrustRecoveryRevocationBundle(); }
export async function validateRequest(request: Request) { return validateTrustRecoveryRevocation(resultFromBody(await readBody(request))); }
export async function suspensionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRecoveryRevocation(); return { suspension: result.suspension }; }
export async function revocationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRecoveryRevocation(); return { revocation: result.revocation }; }
export async function planRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRecoveryRevocation(); return { plan: result.plan }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRecoveryRevocation(); return { evidence: result.evidence }; }
export async function requalificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRecoveryRevocation(); return { requalification: result.requalification }; }
export async function decisionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRecoveryRevocation(); return { decision: result.decision }; }
export async function approvalRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRecoveryRevocation(); return { approval: result.approval }; }
export async function observabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRecoveryRevocation(); return { observability: result.observability }; }
export async function auditRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRecoveryRevocation(); return { audit: result.audit }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRecoveryRevocation(); return { certification: result.certification, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
