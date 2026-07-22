import { getWaveFivePersonalKnowledgeBundle, runWaveFivePersonalKnowledge, validateWaveFivePersonalKnowledge } from "@/services/wave-five-personal-knowledge";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { WaveFivePersonalKnowledgeInput, WaveFivePersonalKnowledgeResult } from "@/types/wave-five-personal-knowledge";

export async function requireWaveFivePersonalKnowledgeUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): WaveFivePersonalKnowledgeInput { return body as WaveFivePersonalKnowledgeInput; }
function resultFromBody(body: Record<string, unknown>): WaveFivePersonalKnowledgeResult { return (body.result as WaveFivePersonalKnowledgeResult | undefined) ?? runWaveFivePersonalKnowledge(inputFromBody(body)); }
export function contractResponse() { return getWaveFivePersonalKnowledgeBundle(); }
export async function validateRequest(request: Request) { return validateWaveFivePersonalKnowledge(resultFromBody(await readBody(request))); }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFivePersonalKnowledge(); return { registry: result.registry }; }
export async function graphRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFivePersonalKnowledge(); return { graph: result.graph }; }
export async function retrievalRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFivePersonalKnowledge(); return { retrieval: result.retrieval }; }
export async function reliabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFivePersonalKnowledge(); return { reliability: result.reliability }; }
export async function reviewRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFivePersonalKnowledge(); return { review: result.review }; }
export async function evidenceSyncRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFivePersonalKnowledge(); return { evidence_sync: result.evidence_sync }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFivePersonalKnowledge(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
