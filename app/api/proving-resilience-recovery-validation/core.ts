import { getProvingResilienceRecoveryValidationBundle, runProvingResilienceRecoveryValidation, validateProvingResilienceRecoveryValidation } from "@/services/proving-resilience-recovery-validation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ResilienceInput, ResilienceResult } from "@/types/proving-resilience-recovery-validation";

export async function requireResilienceRecoveryUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ResilienceInput { return body as ResilienceInput; }
function resultFromBody(body: Record<string, unknown>): ResilienceResult { return (body.result as ResilienceResult | undefined) ?? runProvingResilienceRecoveryValidation(inputFromBody(body)); }
export function contractResponse() { return getProvingResilienceRecoveryValidationBundle(); }
export async function validateRequest(request: Request) { return validateProvingResilienceRecoveryValidation(resultFromBody(await readBody(request))); }
export async function frameworkRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingResilienceRecoveryValidation(); return { framework: result.framework }; }
export async function failureInjectionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingResilienceRecoveryValidation(); return { failure_injection: result.failure_injection }; }
export async function recoveryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingResilienceRecoveryValidation(); return { recovery_engine: result.recovery_engine }; }
export async function failoverRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingResilienceRecoveryValidation(); return { failover_report: result.failover_report }; }
export async function disasterRecoveryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingResilienceRecoveryValidation(); return { disaster_recovery_report: result.disaster_recovery_report }; }
export async function degradationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingResilienceRecoveryValidation(); return { degradation_report: result.degradation_report }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingResilienceRecoveryValidation(); return { recovery_replay_report: result.recovery_replay_report }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingResilienceRecoveryValidation(); return { evidence: result.evidence }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingResilienceRecoveryValidation(); return { gates: result.gates, invariants: result.invariants, boundaries: result.boundaries, readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
