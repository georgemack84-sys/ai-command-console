import { getMissionRecommendationIntelligenceBundle, runMissionRecommendationIntelligence, validateMissionRecommendationIntelligence } from "@/services/mission-recommendation-intelligence";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { MissionRecommendationInput, MissionRecommendationResult } from "@/types/mission-recommendation-intelligence";

export async function requireMissionRecommendationUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): MissionRecommendationInput { return body as MissionRecommendationInput; }
function resultFromBody(body: Record<string, unknown>): MissionRecommendationResult { return (body.result as MissionRecommendationResult | undefined) ?? runMissionRecommendationIntelligence(inputFromBody(body)); }
export function contractResponse() { return getMissionRecommendationIntelligenceBundle(); }
export async function validateRequest(request: Request) { return validateMissionRecommendationIntelligence(resultFromBody(await readBody(request))); }
export async function engineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionRecommendationIntelligence(); return { engine: result.engine }; }
export async function analysisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionRecommendationIntelligence(); return { analysis: result.analysis }; }
export async function explanationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionRecommendationIntelligence(); return { explanation: result.explanation }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionRecommendationIntelligence(); return { governance: result.governance }; }
export async function prioritizationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionRecommendationIntelligence(); return { prioritization: result.prioritization }; }
export async function confidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionRecommendationIntelligence(); return { confidence: result.confidence }; }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionRecommendationIntelligence(); return { lifecycle: result.lifecycle }; }
export async function feedRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionRecommendationIntelligence(); return { feed: result.feed }; }
export async function reportsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionRecommendationIntelligence(); return { reports: result.reports }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionRecommendationIntelligence(); return { evidence: result.evidence }; }
export async function apisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionRecommendationIntelligence(); return { apis: result.apis }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionRecommendationIntelligence(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
