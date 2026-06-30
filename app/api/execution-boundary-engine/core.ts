import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildExecutionBoundaryPackage,
  buildExecutionBoundaryVisibilitySurface,
  getExecutionBoundaryFramework,
} from "@/services/execution-boundary-engine";
import type { AuthorityBoundaryPackage } from "@/types/authority-boundary-engine";
import type { ExecutionBoundaryScenario } from "@/types/execution-boundary-engine";

export async function requireExecutionBoundaryUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function packageFromBody(body: Record<string, unknown>) {
  return buildExecutionBoundaryPackage({
    scenario: body.scenario as ExecutionBoundaryScenario | undefined,
    authorityPackage: body.authorityPackage as AuthorityBoundaryPackage | undefined,
  });
}

export function getExecutionBoundaryContractResponse() {
  return getExecutionBoundaryFramework();
}

export async function validateExecutionBoundaryRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body);
}

export async function executionBoundaryDecisionRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).execution_boundary.decision;
}

export async function executionBoundaryEvidenceRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).execution_evidence;
}

export async function executionBoundaryReplayRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).replay;
}

export async function executionBoundaryLedgerRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).ledger_entry;
}

export async function inspectExecutionBoundaryRequest(request?: Request) {
  if (!request) return buildExecutionBoundaryVisibilitySurface();
  const body = await readBody(request);
  return buildExecutionBoundaryVisibilitySurface(packageFromBody(body));
}
