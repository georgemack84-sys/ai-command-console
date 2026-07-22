import { getPilotScopeEnrollmentBundle, runPilotScopeEnrollment, validatePilotScopeEnrollment } from "@/services/pilot-scope-enrollment";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { PilotScopeEnrollmentInput, PilotScopeEnrollmentResult } from "@/types/pilot-scope-enrollment";

export async function requirePilotScopeEnrollmentUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): PilotScopeEnrollmentInput { return body as PilotScopeEnrollmentInput; }
function resultFromBody(body: Record<string, unknown>): PilotScopeEnrollmentResult { return (body.result as PilotScopeEnrollmentResult | undefined) ?? runPilotScopeEnrollment(inputFromBody(body)); }

export function contractResponse() { return getPilotScopeEnrollmentBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runPilotScopeEnrollment(); }
export async function scopeRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotScopeEnrollment(); return { scope: result.scope, scope_version: result.scope_version }; }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotScopeEnrollment(); return { tenant_qualification: result.tenant_qualification, operator_qualification: result.operator_qualification }; }
export async function workflowRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotScopeEnrollment(); return { lifecycle: result.lifecycle, workflow: result.workflow, capabilities: result.capabilities, datasets: result.datasets, environments: result.environments }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotScopeEnrollment(); return { ledger: result.ledger }; }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotScopeEnrollment(); return { lineage: result.lineage }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotScopeEnrollment(); return { certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validatePilotScopeEnrollment(resultFromBody(await readBody(request))); }
