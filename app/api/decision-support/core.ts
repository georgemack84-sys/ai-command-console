import { getDecisionSupportBundle, runDecisionSupport, validateDecisionSupport } from "@/services/decision-support";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { DecisionSupportInput, DecisionSupportResult } from "@/types/decision-support";

export async function requireDecisionSupportUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): DecisionSupportInput { return body as DecisionSupportInput; }
function resultFromBody(body: Record<string, unknown>): DecisionSupportResult { return (body.result as DecisionSupportResult | undefined) ?? runDecisionSupport(inputFromBody(body)); }
export function contractResponse() { return getDecisionSupportBundle(); }
export async function validateRequest(request: Request) { return validateDecisionSupport(resultFromBody(await readBody(request))); }
export async function engineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDecisionSupport(); return { decision_engine: result.decision_engine }; }
export async function tradeoffsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDecisionSupport(); return { tradeoff_analyzer: result.tradeoff_analyzer }; }
export async function multiCriteriaRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDecisionSupport(); return { multi_criteria: result.multi_criteria }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDecisionSupport(); return { evidence_aggregator: result.evidence_aggregator }; }
export async function justificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDecisionSupport(); return { justification: result.justification }; }
export async function advisoryGateRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDecisionSupport(); return { advisory_gate: result.advisory_gate }; }
export async function artifactsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDecisionSupport(); return { artifacts: result.artifacts }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDecisionSupport(); return { governance: result.governance }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDecisionSupport(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
