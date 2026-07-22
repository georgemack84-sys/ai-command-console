import { getInstitutionalMemoryBundle, runInstitutionalMemory, validateInstitutionalMemory } from "@/services/institutional-memory";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { InstitutionalMemoryInput, InstitutionalMemoryResult } from "@/types/institutional-memory";

export async function requireInstitutionalMemoryUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): InstitutionalMemoryInput { return body as InstitutionalMemoryInput; }
function resultFromBody(body: Record<string, unknown>): InstitutionalMemoryResult { return (body.result as InstitutionalMemoryResult | undefined) ?? runInstitutionalMemory(inputFromBody(body)); }
export function contractResponse() { return getInstitutionalMemoryBundle(); }
export async function validateRequest(request: Request) { return validateInstitutionalMemory(resultFromBody(await readBody(request))); }
export async function captureRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runInstitutionalMemory(); return { capture: result.capture }; }
export async function repositoryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runInstitutionalMemory(); return { repository: result.repository }; }
export async function graphRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runInstitutionalMemory(); return { graph: result.graph }; }
export async function patternsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runInstitutionalMemory(); return { patterns: result.patterns }; }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runInstitutionalMemory(); return { lineage: result.lineage }; }
export async function validationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runInstitutionalMemory(); return { validation: result.validation }; }
export async function learningRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runInstitutionalMemory(); return { learning: result.learning }; }
export async function searchRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runInstitutionalMemory(); return { search: result.search }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runInstitutionalMemory(); return { governance: result.governance }; }
export async function reportsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runInstitutionalMemory(); return { reports: result.reports }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runInstitutionalMemory(); return { evidence: result.evidence }; }
export async function apisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runInstitutionalMemory(); return { apis: result.apis }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runInstitutionalMemory(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
