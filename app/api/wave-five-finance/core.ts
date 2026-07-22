import { getWaveFiveFinanceBundle, runWaveFiveFinance, validateWaveFiveFinance } from "@/services/wave-five-finance";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { WaveFiveFinanceInput, WaveFiveFinanceResult } from "@/types/wave-five-finance";

export async function requireWaveFiveFinanceUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): WaveFiveFinanceInput { return body as WaveFiveFinanceInput; }
function resultFromBody(body: Record<string, unknown>): WaveFiveFinanceResult { return (body.result as WaveFiveFinanceResult | undefined) ?? runWaveFiveFinance(inputFromBody(body)); }
export function contractResponse() { return getWaveFiveFinanceBundle(); }
export async function validateRequest(request: Request) { return validateWaveFiveFinance(resultFromBody(await readBody(request))); }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveFinance(); return { registry: result.registry }; }
export async function budgetRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveFinance(); return { budget: result.budget }; }
export async function cashFlowRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveFinance(); return { cash_flow: result.cash_flow }; }
export async function forecastRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveFinance(); return { forecast: result.forecast }; }
export async function analyticsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveFinance(); return { analytics: result.analytics }; }
export async function dashboardRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveFinance(); return { dashboard: result.dashboard }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveFinance(); return { governance: result.governance }; }
export async function apisEvidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveFinance(); return { apis_evidence: result.apis_evidence }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveFinance(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
