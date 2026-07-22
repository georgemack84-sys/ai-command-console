import { getMemoryEngineBundle, runMemoryEngine, validateMemoryEngine } from "@/services/memory-engine";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { MemoryEngineInput, MemoryEngineResult } from "@/types/memory-engine";

export async function requireMemoryEngineUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): MemoryEngineInput { return body as MemoryEngineInput; }
function resultFromBody(body: Record<string, unknown>): MemoryEngineResult { return (body.result as MemoryEngineResult | undefined) ?? runMemoryEngine(inputFromBody(body)); }
export function contractResponse() { return getMemoryEngineBundle(); }
export async function validateRequest(request: Request) { return validateMemoryEngine(resultFromBody(await readBody(request))); }
export async function workingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMemoryEngine(); return { working: result.working }; }
export async function semanticRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMemoryEngine(); return { semantic: result.semantic }; }
export async function proceduralRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMemoryEngine(); return { procedural: result.procedural }; }
export async function episodicRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMemoryEngine(); return { episodic: result.episodic }; }
export async function provenanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMemoryEngine(); return { provenance: result.provenance }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMemoryEngine(); return { governance: result.governance }; }
export async function retrievalRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMemoryEngine(); return { retrieval: result.retrieval }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMemoryEngine(); return { registry: result.registry }; }
export async function apisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMemoryEngine(); return { apis: result.apis }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMemoryEngine(); return { evidence: result.evidence }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMemoryEngine(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
