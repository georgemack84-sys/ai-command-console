import { getObservabilityOperationsBundle, runObservabilityOperations, validateObservabilityOperations } from "@/services/observability-operations";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ObservabilityOperationsInput, ObservabilityOperationsResult } from "@/types/observability-operations";

export async function requireObservabilityOperationsUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ObservabilityOperationsInput { return body as ObservabilityOperationsInput; }
function resultFromBody(body: Record<string, unknown>): ObservabilityOperationsResult { return (body.result as ObservabilityOperationsResult | undefined) ?? runObservabilityOperations(inputFromBody(body)); }

export function contractResponse() { return getObservabilityOperationsBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runObservabilityOperations(); }
export async function dashboardRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runObservabilityOperations(); return { dashboard: result.dashboard }; }
export async function monitorsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runObservabilityOperations(); return { monitors: result.monitors }; }
export async function alertsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runObservabilityOperations(); return { alerts: result.alerts }; }
export async function runbooksRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runObservabilityOperations(); return { runbooks: result.runbooks }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runObservabilityOperations(); return { evidence_ledger: result.evidence_ledger }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runObservabilityOperations(); return { certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateObservabilityOperations(resultFromBody(await readBody(request))); }
