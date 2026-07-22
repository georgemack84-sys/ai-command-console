import { getContinuousMonitoringIntelligenceBundle, runContinuousMonitoringIntelligence, validateContinuousMonitoringIntelligence } from "@/services/continuous-monitoring-intelligence";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ContinuousMonitoringIntelligenceInput, ContinuousMonitoringIntelligenceResult } from "@/types/continuous-monitoring-intelligence";

export async function requireContinuousMonitoringIntelligenceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ContinuousMonitoringIntelligenceInput { return body as ContinuousMonitoringIntelligenceInput; }
function resultFromBody(body: Record<string, unknown>): ContinuousMonitoringIntelligenceResult { return (body.result as ContinuousMonitoringIntelligenceResult | undefined) ?? runContinuousMonitoringIntelligence(inputFromBody(body)); }

export function contractResponse() { return getContinuousMonitoringIntelligenceBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runContinuousMonitoringIntelligence(); }
export async function monitorRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousMonitoringIntelligence(); return { operations_monitor: result.operations_monitor, monitoring_cycle: result.monitoring_cycle }; }
export async function healthRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousMonitoringIntelligence(); return { health_analyzer: result.health_analyzer }; }
export async function intelligenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousMonitoringIntelligence(); return { performance_intelligence: result.performance_intelligence, capacity_intelligence: result.capacity_intelligence, anomaly_classifier: result.anomaly_classifier }; }
export async function changesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousMonitoringIntelligence(); return { change_detector: result.change_detector }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousMonitoringIntelligence(); return { output_reports: result.output_reports, evidence_ledger: result.evidence_ledger }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousMonitoringIntelligence(); return { certification_package: result.certification_package, certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateContinuousMonitoringIntelligence(resultFromBody(await readBody(request))); }
