import { getTrustHumanOversightStageSevenBundle, runTrustHumanOversightStageSeven, validateTrustHumanOversightStageSeven } from "@/services/trust-human-oversight-stage-seven";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { TrustHumanOversightInput, TrustHumanOversightResult } from "@/types/trust-human-oversight-stage-seven";

export async function requireTrustHumanOversightStageSevenUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): TrustHumanOversightInput { return body as TrustHumanOversightInput; }
function resultFromBody(body: Record<string, unknown>): TrustHumanOversightResult { return (body.result as TrustHumanOversightResult | undefined) ?? runTrustHumanOversightStageSeven(inputFromBody(body)); }
export function contractResponse() { return getTrustHumanOversightStageSevenBundle(); }
export async function validateRequest(request: Request) { return validateTrustHumanOversightStageSeven(resultFromBody(await readBody(request))); }
export async function queueRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustHumanOversightStageSeven(); return { queue: result.queue }; }
export async function workflowRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustHumanOversightStageSeven(); return { workflow: result.workflow }; }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustHumanOversightStageSeven(); return { lifecycle: result.lifecycle }; }
export async function decisionRecordRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustHumanOversightStageSeven(); return { decision_record: result.decision_record }; }
export async function resolutionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustHumanOversightStageSeven(); return { resolution: result.resolution }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustHumanOversightStageSeven(); return { evidence: result.evidence }; }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustHumanOversightStageSeven(); return { lineage: result.lineage }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustHumanOversightStageSeven(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
