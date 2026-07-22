import { getTrustIndependentEvaluationBundle, runTrustIndependentEvaluation, validateTrustIndependentEvaluation } from "@/services/trust-independent-evaluation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { TrustIndependentEvaluationInput, TrustIndependentEvaluationResult } from "@/types/trust-independent-evaluation";

export async function requireTrustIndependentEvaluationUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): TrustIndependentEvaluationInput { return body as TrustIndependentEvaluationInput; }
function resultFromBody(body: Record<string, unknown>): TrustIndependentEvaluationResult { return (body.result as TrustIndependentEvaluationResult | undefined) ?? runTrustIndependentEvaluation(inputFromBody(body)); }
export function contractResponse() { return getTrustIndependentEvaluationBundle(); }
export async function validateRequest(request: Request) { return validateTrustIndependentEvaluation(resultFromBody(await readBody(request))); }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustIndependentEvaluation(); return { evidence: result.evidence }; }
export async function confidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustIndependentEvaluation(); return { confidence: result.confidence }; }
export async function riskRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustIndependentEvaluation(); return { risk: result.risk }; }
export async function alignmentRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustIndependentEvaluation(); return { alignment: result.alignment }; }
export async function reportsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustIndependentEvaluation(); return { reports: result.reports }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustIndependentEvaluation(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
