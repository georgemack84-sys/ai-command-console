import { getOperationalIntelligenceBundle, runOperationalIntelligence, validateOperationalIntelligence } from "@/services/operational-intelligence";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { OperationalIntelligenceInput, OperationalIntelligenceResult } from "@/types/operational-intelligence";

export async function requireOperationalIntelligenceUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): OperationalIntelligenceInput { return body as OperationalIntelligenceInput; }
function resultFromBody(body: Record<string, unknown>): OperationalIntelligenceResult { return (body.result as OperationalIntelligenceResult | undefined) ?? runOperationalIntelligence(inputFromBody(body)); }
export function contractResponse() { return getOperationalIntelligenceBundle(); }
export async function validateRequest(request: Request) { return validateOperationalIntelligence(resultFromBody(await readBody(request))); }
export async function strategicRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalIntelligence(); return { strategic: result.strategic, temporal: result.temporal }; }
export async function insightsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalIntelligence(); return { insights: result.insights }; }
export async function executiveRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalIntelligence(); return { executive: result.executive }; }
export async function trendsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalIntelligence(); return { trends: result.trends }; }
export async function forecastRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalIntelligence(); return { forecast: result.forecast }; }
export async function organizationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalIntelligence(); return { organization: result.organization }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalIntelligence(); return { registry: result.registry }; }
export async function reportsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalIntelligence(); return { reports: result.reports }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalIntelligence(); return { evidence: result.evidence }; }
export async function apisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalIntelligence(); return { apis: result.apis }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalIntelligence(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
