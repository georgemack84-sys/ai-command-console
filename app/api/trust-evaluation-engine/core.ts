import { getTrustEvaluationEngineBundle, runTrustEvaluationEngine, validateTrustEvaluationEngine } from "@/services/trust-evaluation-engine";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { TrustEvaluationInput, TrustEvaluationResult } from "@/types/trust-evaluation-engine";

export async function requireTrustEvaluationUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): TrustEvaluationInput { return body as TrustEvaluationInput; }
function resultFromBody(body: Record<string, unknown>): TrustEvaluationResult { return (body.result as TrustEvaluationResult | undefined) ?? runTrustEvaluationEngine(inputFromBody(body)); }
export function contractResponse() { return getTrustEvaluationEngineBundle(); }
export async function validateRequest(request: Request) { return validateTrustEvaluationEngine(resultFromBody(await readBody(request))); }
export async function packageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustEvaluationEngine(); return { architecture: result.architecture, evidence_package: result.evidence_package }; }
export async function integrationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustEvaluationEngine(); return { confidence: result.confidence, risk: result.risk, rules: result.rules }; }
export async function standingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustEvaluationEngine(); return { standing: result.standing, autonomy_eligibility: result.autonomy_eligibility }; }
export async function decisionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustEvaluationEngine(); return { decision: result.decision }; }
export async function explanationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustEvaluationEngine(); return { explanation: result.explanation, replay_package: result.replay_package }; }
export async function observabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustEvaluationEngine(); return { observability: result.observability }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustEvaluationEngine(); return { certification: result.certification, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
