import { getTrustRiskGovernanceBundle, runTrustRiskGovernance, validateTrustRiskGovernance } from "@/services/trust-risk-governance";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { TrustRiskGovernanceInput, TrustRiskGovernanceResult } from "@/types/trust-risk-governance";

export async function requireTrustRiskGovernanceUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): TrustRiskGovernanceInput { return body as TrustRiskGovernanceInput; }
function resultFromBody(body: Record<string, unknown>): TrustRiskGovernanceResult { return (body.result as TrustRiskGovernanceResult | undefined) ?? runTrustRiskGovernance(inputFromBody(body)); }
export function contractResponse() { return getTrustRiskGovernanceBundle(); }
export async function validateRequest(request: Request) { return validateTrustRiskGovernance(resultFromBody(await readBody(request))); }
export async function modelRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRiskGovernance(); return { taxonomy: result.taxonomy, model: result.model }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRiskGovernance(); return { registry: result.registry }; }
export async function assessmentRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRiskGovernance(); return { assessment: result.assessment }; }
export async function aggregationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRiskGovernance(); return { aggregation: result.aggregation }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRiskGovernance(); return { governance: result.governance, report: result.report }; }
export async function observabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRiskGovernance(); return { observability: result.observability }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustRiskGovernance(); return { certification: result.certification, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
