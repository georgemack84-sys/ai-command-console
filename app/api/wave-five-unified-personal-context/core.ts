import { getWaveFiveUnifiedPersonalContextBundle, runWaveFiveUnifiedPersonalContext, validateWaveFiveUnifiedPersonalContext } from "@/services/wave-five-unified-personal-context";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { WaveFiveUnifiedPersonalContextInput, WaveFiveUnifiedPersonalContextResult } from "@/types/wave-five-unified-personal-context";

export async function requireWaveFiveUnifiedPersonalContextUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): WaveFiveUnifiedPersonalContextInput { return body as WaveFiveUnifiedPersonalContextInput; }
function resultFromBody(body: Record<string, unknown>): WaveFiveUnifiedPersonalContextResult { return (body.result as WaveFiveUnifiedPersonalContextResult | undefined) ?? runWaveFiveUnifiedPersonalContext(inputFromBody(body)); }
export function contractResponse() { return getWaveFiveUnifiedPersonalContextBundle(); }
export async function validateRequest(request: Request) { return validateWaveFiveUnifiedPersonalContext(resultFromBody(await readBody(request))); }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveUnifiedPersonalContext(); return { registry: result.registry }; }
export async function graphRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveUnifiedPersonalContext(); return { graph: result.graph }; }
export async function timelineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveUnifiedPersonalContext(); return { timeline: result.timeline }; }
export async function sourceGovernanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveUnifiedPersonalContext(); return { source_governance: result.source_governance }; }
export async function resolutionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveUnifiedPersonalContext(); return { resolution: result.resolution }; }
export async function apisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveUnifiedPersonalContext(); return { apis: result.apis }; }
export async function evidenceTrustRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveUnifiedPersonalContext(); return { evidence_trust: result.evidence_trust }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveUnifiedPersonalContext(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
