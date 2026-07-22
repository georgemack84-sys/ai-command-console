import { getWaveFiveResearchBundle, runWaveFiveResearch, validateWaveFiveResearch } from "@/services/wave-five-research";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { WaveFiveResearchInput, WaveFiveResearchResult } from "@/types/wave-five-research";

export async function requireWaveFiveResearchUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): WaveFiveResearchInput { return body as WaveFiveResearchInput; }
function resultFromBody(body: Record<string, unknown>): WaveFiveResearchResult { return (body.result as WaveFiveResearchResult | undefined) ?? runWaveFiveResearch(inputFromBody(body)); }
export function contractResponse() { return getWaveFiveResearchBundle(); }
export async function validateRequest(request: Request) { return validateWaveFiveResearch(resultFromBody(await readBody(request))); }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveResearch(); return { registry: result.registry }; }
export async function sourceGovernanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveResearch(); return { source_governance: result.source_governance }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveResearch(); return { evidence: result.evidence }; }
export async function matrixRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveResearch(); return { matrix: result.matrix }; }
export async function citationNotebookRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveResearch(); return { citation_notebook: result.citation_notebook }; }
export async function synthesisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveResearch(); return { synthesis: result.synthesis }; }
export async function collaborationSearchGovernanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveResearch(); return { collaboration_search_governance: result.collaboration_search_governance }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveResearch(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
