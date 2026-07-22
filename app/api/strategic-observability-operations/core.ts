import { getStrategicObservabilityOperationsContract, runStrategicObservabilityOperations, validateStrategicObservabilityOperations } from "@/services/strategic-observability-operations";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { StrategicOperationsInput, StrategicOperationsResult } from "@/types/strategic-observability-operations";

export async function requireStrategicOperationsUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): StrategicOperationsInput { return body as StrategicOperationsInput; }
function resultFromBody(body: Record<string, unknown>): StrategicOperationsResult { return (body.result as StrategicOperationsResult | undefined) ?? runStrategicObservabilityOperations(inputFromBody(body)); }

export function contractResponse() { return getStrategicObservabilityOperationsContract(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runStrategicObservabilityOperations(); }
export async function dashboardRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicObservabilityOperations(); return { dashboard: result.dashboard, summary: result.summary }; }
export async function cyclesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicObservabilityOperations(); return { cycle_monitor: result.cycle_monitor }; }
export async function artifactsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicObservabilityOperations(); return { artifact_health: result.artifact_health }; }
export async function manifestsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicObservabilityOperations(); return { manifest_health: result.manifest_health }; }
export async function performanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicObservabilityOperations(); return { performance: result.performance }; }
export async function observationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicObservabilityOperations(); return { observation_health: result.observation_health }; }
export async function replayIntegrityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicObservabilityOperations(); return { replay_integrity: result.replay_integrity }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicObservabilityOperations(); return { governance_operations: result.governance_operations }; }
export async function tenantRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicObservabilityOperations(); return { tenant_operations: result.tenant_operations }; }
export async function derivedViewsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicObservabilityOperations(); return { derived_views: result.derived_views }; }
export async function alertsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicObservabilityOperations(); return { alerts: result.alerts }; }
export async function runbooksRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicObservabilityOperations(); return { runbooks: result.runbooks }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicObservabilityOperations(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function validateRequest(request: Request) { return validateStrategicObservabilityOperations(resultFromBody(await readBody(request))); }
