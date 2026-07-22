import { getTrustContinuousMonitoringStageEightBundle, runTrustContinuousMonitoringStageEight, validateTrustContinuousMonitoringStageEight } from "@/services/trust-continuous-monitoring-stage-eight";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { TrustContinuousMonitoringInput, TrustContinuousMonitoringResult } from "@/types/trust-continuous-monitoring-stage-eight";

export async function requireTrustContinuousMonitoringStageEightUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): TrustContinuousMonitoringInput { return body as TrustContinuousMonitoringInput; }
function resultFromBody(body: Record<string, unknown>): TrustContinuousMonitoringResult { return (body.result as TrustContinuousMonitoringResult | undefined) ?? runTrustContinuousMonitoringStageEight(inputFromBody(body)); }
export function contractResponse() { return getTrustContinuousMonitoringStageEightBundle(); }
export async function validateRequest(request: Request) { return validateTrustContinuousMonitoringStageEight(resultFromBody(await readBody(request))); }
export async function monitoringRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustContinuousMonitoringStageEight(); return { monitoring: result.monitoring }; }
export async function healthRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustContinuousMonitoringStageEight(); return { health: result.health }; }
export async function standingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustContinuousMonitoringStageEight(); return { standing: result.standing }; }
export async function freshnessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustContinuousMonitoringStageEight(); return { freshness: result.freshness }; }
export async function behaviorRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustContinuousMonitoringStageEight(); return { behavior: result.behavior }; }
export async function eventsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustContinuousMonitoringStageEight(); return { events: result.events }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustContinuousMonitoringStageEight(); return { evidence: result.evidence }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustContinuousMonitoringStageEight(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
