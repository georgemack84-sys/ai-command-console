import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { buildGovernancePolicyPackage, buildGovernancePolicyVisibilitySurface, getGovernancePolicyFramework } from "@/services/governance-policy-enforcement-engine";
import type { ExecutionBoundaryPackage } from "@/types/execution-boundary-engine";
import type { GovernancePolicyScenario } from "@/types/governance-policy-enforcement-engine";

export async function requireGovernancePolicyUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function packageFromBody(body: Record<string, unknown>) {
  return buildGovernancePolicyPackage({
    scenario: body.scenario as GovernancePolicyScenario | undefined,
    executionBoundaryPackage: body.executionBoundaryPackage as ExecutionBoundaryPackage | undefined,
  });
}

export function getGovernancePolicyContractResponse() {
  return getGovernancePolicyFramework();
}

export async function enforceGovernancePolicyRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body);
}

export async function governancePolicyDecisionRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).governance_enforcement.enforcement_decision;
}

export async function governancePolicyEvidenceRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).evidence;
}

export async function governancePolicyReplayRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).replay;
}

export async function governancePolicyLedgerRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).ledger_entry;
}

export async function inspectGovernancePolicyRequest(request?: Request) {
  if (!request) return buildGovernancePolicyVisibilitySurface();
  const body = await readBody(request);
  return buildGovernancePolicyVisibilitySurface(packageFromBody(body));
}
