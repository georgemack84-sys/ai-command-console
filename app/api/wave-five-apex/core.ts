import { getWaveFiveApexBundle, runWaveFiveApex, validateWaveFiveApex } from "@/services/wave-five-apex";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { WaveFiveApexInput, WaveFiveApexResult } from "@/types/wave-five-apex";

export async function requireWaveFiveApexUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): WaveFiveApexInput { return body as WaveFiveApexInput; }
function resultFromBody(body: Record<string, unknown>): WaveFiveApexResult { return (body.result as WaveFiveApexResult | undefined) ?? runWaveFiveApex(inputFromBody(body)); }
export function contractResponse() { return getWaveFiveApexBundle(); }
export async function validateRequest(request: Request) { return validateWaveFiveApex(resultFromBody(await readBody(request))); }
export async function performanceMeasurementRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveApex(); return { performance_measurement: result.performance_measurement }; }
export async function dashboardHabitsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveApex(); return { dashboard_habits: result.dashboard_habits }; }
export async function reviewsExperimentsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveApex(); return { reviews_experiments: result.reviews_experiments }; }
export async function outcomeIntelligenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveApex(); return { outcome_intelligence: result.outcome_intelligence }; }
export async function goalPatternsCorrelationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveApex(); return { goal_patterns_correlation: result.goal_patterns_correlation }; }
export async function evidenceGovernanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveApex(); return { evidence_governance: result.evidence_governance }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveApex(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
