import { getProductionObservabilityOperatorControlBundle, runProductionObservabilityOperatorControl, validateProductionObservabilityOperatorControl } from "@/services/production-observability-operator-control";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ProductionObservabilityInput, ProductionObservabilityResult } from "@/types/production-observability-operator-control";

export async function requireProductionObservabilityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ProductionObservabilityInput { return body as ProductionObservabilityInput; }
function resultFromBody(body: Record<string, unknown>): ProductionObservabilityResult { return (body.result as ProductionObservabilityResult | undefined) ?? runProductionObservabilityOperatorControl(inputFromBody(body)); }

export function contractResponse() { return getProductionObservabilityOperatorControlBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runProductionObservabilityOperatorControl(); }
export async function dashboardsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionObservabilityOperatorControl(); return { dashboard: result.dashboard, release_health: result.release_health, tenant_isolation: result.tenant_isolation, advisory_boundary: result.advisory_boundary, replay_divergence: result.replay_divergence, certification_status: result.certification_status }; }
export async function operatorRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionObservabilityOperatorControl(); return { operator_action: result.operator_action }; }
export async function alertsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionObservabilityOperatorControl(); return { alert: result.alert }; }
export async function runbooksRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionObservabilityOperatorControl(); return { runbook: result.runbook }; }
export async function timelineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionObservabilityOperatorControl(); return { timeline: result.timeline }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionObservabilityOperatorControl(); return { certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateProductionObservabilityOperatorControl(resultFromBody(await readBody(request))); }
