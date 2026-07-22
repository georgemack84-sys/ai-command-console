import { getRiskAssessmentBundle, runRiskAssessment, validateRiskAssessment } from "@/services/risk-assessment";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { RiskAssessmentInput, RiskAssessmentResult } from "@/types/risk-assessment";

export async function requireRiskAssessmentUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): RiskAssessmentInput { return body as RiskAssessmentInput; }
function resultFromBody(body: Record<string, unknown>): RiskAssessmentResult { return (body.result as RiskAssessmentResult | undefined) ?? runRiskAssessment(inputFromBody(body)); }
export function contractResponse() { return getRiskAssessmentBundle(); }
export async function validateRequest(request: Request) { return validateRiskAssessment(resultFromBody(await readBody(request))); }
export async function temporalRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRiskAssessment(); return { temporal: result.temporal }; }
export async function evaluationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRiskAssessment(); return { evaluation: result.evaluation }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRiskAssessment(); return { registry: result.registry }; }
export async function trendsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRiskAssessment(); return { trends: result.trends }; }
export async function forecastRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRiskAssessment(); return { forecast: result.forecast }; }
export async function correlationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRiskAssessment(); return { correlation: result.correlation }; }
export async function prioritizationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRiskAssessment(); return { prioritization: result.prioritization }; }
export async function explainabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRiskAssessment(); return { explainability: result.explainability }; }
export async function visualizationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRiskAssessment(); return { visualization: result.visualization }; }
export async function reportsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRiskAssessment(); return { reports: result.reports }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRiskAssessment(); return { evidence: result.evidence }; }
export async function apisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRiskAssessment(); return { apis: result.apis }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRiskAssessment(); return { readiness: result.readiness, risk_score: result.risk_score, severity: result.severity, trend: result.trend, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
