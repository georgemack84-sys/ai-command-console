import { getPilotReadinessAssessmentBundle, runPilotReadinessAssessment, validatePilotReadinessAssessment } from "@/services/pilot-readiness-assessment";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { PilotReadinessAssessmentInput, PilotReadinessAssessmentResult } from "@/types/pilot-readiness-assessment";

export async function requirePilotReadinessAssessmentUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): PilotReadinessAssessmentInput { return body as PilotReadinessAssessmentInput; }
function resultFromBody(body: Record<string, unknown>): PilotReadinessAssessmentResult { return (body.result as PilotReadinessAssessmentResult | undefined) ?? runPilotReadinessAssessment(inputFromBody(body)); }

export function contractResponse() { return getPilotReadinessAssessmentBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runPilotReadinessAssessment(); }
export async function scorecardRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotReadinessAssessment(); return { scorecard: result.scorecard, category_assessments: result.category_assessments }; }
export async function reportsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotReadinessAssessment(); return { operational_health_report: result.operational_health_report, governance_compliance_report: result.governance_compliance_report, certification_dashboard: result.certification_dashboard }; }
export async function metricsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotReadinessAssessment(); return { metrics_registry: result.metrics_registry, trend_analyzer: result.trend_analyzer }; }
export async function decisionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotReadinessAssessment(); return { decision: result.decision, history: result.history }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotReadinessAssessment(); return { evidence_ledger: result.evidence_ledger }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotReadinessAssessment(); return { certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validatePilotReadinessAssessment(resultFromBody(await readBody(request))); }
