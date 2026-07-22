import { getTrustRecoveryRevocationStageTenBundle, runTrustRecoveryRevocationStageTen, validateTrustRecoveryRevocationStageTen } from "@/services/trust-recovery-revocation-stage-ten";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { TrustRecoveryRevocationInput, TrustRecoveryRevocationResult } from "@/types/trust-recovery-revocation-stage-ten";

export async function requireTrustRecoveryRevocationStageTenUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): TrustRecoveryRevocationInput { return body as TrustRecoveryRevocationInput; }
function resultFromBody(body: Record<string, unknown>): TrustRecoveryRevocationResult { return (body.result as TrustRecoveryRevocationResult | undefined) ?? runTrustRecoveryRevocationStageTen(inputFromBody(body)); }
export function contractResponse() { return getTrustRecoveryRevocationStageTenBundle(); }
export async function validateRequest(request: Request) { return validateTrustRecoveryRevocationStageTen(resultFromBody(await readBody(request))); }
export async function recoveryEvaluationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRecoveryRevocationStageTen(); return { recovery_evaluation: result.recovery_evaluation }; }
export async function standingRecoveryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRecoveryRevocationStageTen(); return { standing_recovery: result.standing_recovery }; }
export async function revocationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRecoveryRevocationStageTen(); return { revocation: result.revocation }; }
export async function suspensionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRecoveryRevocationStageTen(); return { suspension: result.suspension }; }
export async function expirationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRecoveryRevocationStageTen(); return { expiration: result.expiration }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRecoveryRevocationStageTen(); return { evidence: result.evidence }; }
export async function standingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRecoveryRevocationStageTen(); return { transition_engine: result.transition_engine }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRecoveryRevocationStageTen(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
