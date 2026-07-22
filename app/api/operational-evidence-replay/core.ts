import { getOperationalEvidenceReplayBundle, runOperationalEvidenceReplay, validateOperationalEvidenceReplay } from "@/services/operational-evidence-replay";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { OperationalEvidenceReplayInput, OperationalEvidenceReplayResult } from "@/types/operational-evidence-replay";

export async function requireOperationalEvidenceReplayUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): OperationalEvidenceReplayInput { return body as OperationalEvidenceReplayInput; }
function resultFromBody(body: Record<string, unknown>): OperationalEvidenceReplayResult { return (body.result as OperationalEvidenceReplayResult | undefined) ?? runOperationalEvidenceReplay(inputFromBody(body)); }
export function contractResponse() { return getOperationalEvidenceReplayBundle(); }
export async function validateRequest(request: Request) { return validateOperationalEvidenceReplay(resultFromBody(await readBody(request))); }
export async function reconstructionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalEvidenceReplay(); return { reconstruction: result.reconstruction }; }
export async function sessionsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalEvidenceReplay(); return { sessions: result.sessions }; }
export async function timelineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalEvidenceReplay(); return { timeline: result.timeline }; }
export async function stateRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalEvidenceReplay(); return { state: result.state }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalEvidenceReplay(); return { evidence: result.evidence }; }
export async function divergenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalEvidenceReplay(); return { divergence: result.divergence }; }
export async function reportingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalEvidenceReplay(); return { reporting: result.reporting }; }
export async function viewerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalEvidenceReplay(); return { viewer: result.viewer }; }
export async function indexRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalEvidenceReplay(); return { index: result.index }; }
export async function securityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalEvidenceReplay(); return { security: result.security }; }
export async function performanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalEvidenceReplay(); return { performance: result.performance }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalEvidenceReplay(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
