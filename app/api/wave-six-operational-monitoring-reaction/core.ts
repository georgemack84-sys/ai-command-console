import { getWaveSixOperationalMonitoringReactionBundle, runWaveSixOperationalMonitoringReaction, validateWaveSixOperationalMonitoringReaction } from "@/services/wave-six-operational-monitoring-reaction";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { WaveSixOperationalMonitoringReactionInput, WaveSixOperationalMonitoringReactionResult } from "@/types/wave-six-operational-monitoring-reaction";

export async function requireWaveSixOperationalMonitoringReactionUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): WaveSixOperationalMonitoringReactionInput { return body as WaveSixOperationalMonitoringReactionInput; }
function resultFromBody(body: Record<string, unknown>): WaveSixOperationalMonitoringReactionResult { return (body.result as WaveSixOperationalMonitoringReactionResult | undefined) ?? runWaveSixOperationalMonitoringReaction(inputFromBody(body)); }
export function contractResponse() { return getWaveSixOperationalMonitoringReactionBundle(); }
export async function validateRequest(request: Request) { return validateWaveSixOperationalMonitoringReaction(resultFromBody(await readBody(request))); }
export async function observationCorrelationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixOperationalMonitoringReaction(); return { observation_correlation: result.observation_correlation }; }
export async function stateDispositionRecordingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixOperationalMonitoringReaction(); return { state_disposition_recording: result.state_disposition_recording }; }
export async function reactionAuthorizationExecutionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixOperationalMonitoringReaction(); return { reaction_authorization_execution: result.reaction_authorization_execution }; }
export async function auditEvidenceReportsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixOperationalMonitoringReaction(); return { audit_evidence_reports: result.audit_evidence_reports }; }
export async function monitoringReactionBoundaryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixOperationalMonitoringReaction(); return { monitoring_reaction_boundary: result.monitoring_reaction_boundary }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixOperationalMonitoringReaction(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
