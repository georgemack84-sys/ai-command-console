import { getProductionOperationsObservabilityBundle, runProductionOperationsObservability, validateProductionOperationsObservability } from "@/services/production-operations-observability";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ProductionOperationsObservabilityInput, ProductionOperationsObservabilityResult } from "@/types/production-operations-observability";

export async function requireProductionOperationsObservabilityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ProductionOperationsObservabilityInput { return body as ProductionOperationsObservabilityInput; }
function resultFromBody(body: Record<string, unknown>): ProductionOperationsObservabilityResult { return (body.result as ProductionOperationsObservabilityResult | undefined) ?? runProductionOperationsObservability(inputFromBody(body)); }

export function contractResponse() { return getProductionOperationsObservabilityBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runProductionOperationsObservability(); }
export async function dashboardsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionOperationsObservability(); return { dashboards: result.dashboards, certification_package: result.certification_package }; }
export async function healthRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionOperationsObservability(); return { health_engine: result.health_engine, health_records: result.health_records }; }
export async function metricsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionOperationsObservability(); return { event_registry: result.event_registry, metrics_registry: result.metrics_registry }; }
export async function alertsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionOperationsObservability(); return { alert_policy_registry: result.alert_policy_registry, alerts: result.alerts }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionOperationsObservability(); return { evidence_ledger: result.evidence_ledger }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionOperationsObservability(); return { certification_package: result.certification_package, certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateProductionOperationsObservability(resultFromBody(await readBody(request))); }
