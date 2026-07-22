import { getContinuousRiskIntelligenceBundle, runContinuousRiskIntelligence, validateContinuousRiskIntelligence } from "@/services/continuous-risk-intelligence";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ContinuousRiskIntelligenceInput, ContinuousRiskIntelligenceResult } from "@/types/continuous-risk-intelligence";

export async function requireContinuousRiskIntelligenceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ContinuousRiskIntelligenceInput { return body as ContinuousRiskIntelligenceInput; }
function resultFromBody(body: Record<string, unknown>): ContinuousRiskIntelligenceResult { return (body.result as ContinuousRiskIntelligenceResult | undefined) ?? runContinuousRiskIntelligence(inputFromBody(body)); }

export function contractResponse() { return getContinuousRiskIntelligenceBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runContinuousRiskIntelligence(); }
export async function engineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousRiskIntelligence(); return { risk_engine: result.risk_engine, risk_assessment: result.risk_assessment }; }
export async function analyzersRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousRiskIntelligence(); return { risk_analyzers: result.risk_analyzers }; }
export async function correlationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousRiskIntelligence(); return { risk_correlation_engine: result.risk_correlation_engine }; }
export async function recommendationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousRiskIntelligence(); return { recommendation_generator: result.recommendation_generator }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousRiskIntelligence(); return { evidence_registry: result.evidence_registry }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousRiskIntelligence(); return { risk_ledger: result.risk_ledger }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousRiskIntelligence(); return { certification_package: result.certification_package, certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateContinuousRiskIntelligence(resultFromBody(await readBody(request))); }
