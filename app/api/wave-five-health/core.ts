import { getWaveFiveHealthBundle, runWaveFiveHealth, validateWaveFiveHealth } from "@/services/wave-five-health";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { WaveFiveHealthInput, WaveFiveHealthResult } from "@/types/wave-five-health";

export async function requireWaveFiveHealthUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): WaveFiveHealthInput { return body as WaveFiveHealthInput; }
function resultFromBody(body: Record<string, unknown>): WaveFiveHealthResult { return (body.result as WaveFiveHealthResult | undefined) ?? runWaveFiveHealth(inputFromBody(body)); }
export function contractResponse() { return getWaveFiveHealthBundle(); }
export async function validateRequest(request: Request) { return validateWaveFiveHealth(resultFromBody(await readBody(request))); }
export async function profileRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveHealth(); return { profile: result.profile }; }
export async function trackingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveHealth(); return { tracking: result.tracking }; }
export async function dashboardRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveHealth(); return { dashboard: result.dashboard }; }
export async function goalsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveHealth(); return { goals: result.goals }; }
export async function recommendationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveHealth(); return { recommendations: result.recommendations }; }
export async function escalationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveHealth(); return { escalation: result.escalation }; }
export async function evidenceGovernanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveHealth(); return { evidence_governance: result.evidence_governance }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveHealth(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
