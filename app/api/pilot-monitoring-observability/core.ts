import { getPilotMonitoringObservabilityBundle, runPilotMonitoringObservability, validatePilotMonitoringObservability } from "@/services/pilot-monitoring-observability";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { PilotMonitoringObservabilityInput, PilotMonitoringObservabilityResult } from "@/types/pilot-monitoring-observability";

export async function requirePilotMonitoringObservabilityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): PilotMonitoringObservabilityInput { return body as PilotMonitoringObservabilityInput; }
function resultFromBody(body: Record<string, unknown>): PilotMonitoringObservabilityResult { return (body.result as PilotMonitoringObservabilityResult | undefined) ?? runPilotMonitoringObservability(inputFromBody(body)); }

export function contractResponse() { return getPilotMonitoringObservabilityBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runPilotMonitoringObservability(); }
export async function dashboardsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotMonitoringObservability(); return { dashboards: result.dashboards }; }
export async function monitorsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotMonitoringObservability(); return { observability_records: result.observability_records, metrics_registry: result.metrics_registry }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotMonitoringObservability(); return { observability_registry: result.observability_registry }; }
export async function alertsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotMonitoringObservability(); return { alerts: result.alerts, alert_lifecycle: result.alert_lifecycle }; }
export async function streamRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotMonitoringObservability(); return { event_stream: result.event_stream }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotMonitoringObservability(); return { evidence_ledger: result.evidence_ledger }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotMonitoringObservability(); return { certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validatePilotMonitoringObservability(resultFromBody(await readBody(request))); }
