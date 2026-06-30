import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildAuthorityBoundaryPackage,
  buildAuthorityBoundaryVisibilitySurface,
  getAuthorityBoundaryFramework,
} from "@/services/authority-boundary-engine";
import type { BoundaryEnforcementContract } from "@/types/boundary-enforcement-contract";
import type { AuthorityBoundaryScenario } from "@/types/authority-boundary-engine";

export async function requireAuthorityBoundaryUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function packageFromBody(body: Record<string, unknown>) {
  return buildAuthorityBoundaryPackage({
    scenario: body.scenario as AuthorityBoundaryScenario | undefined,
    boundaryContract: body.boundaryContract as BoundaryEnforcementContract | undefined,
  });
}

export function getAuthorityBoundaryContractResponse() {
  return getAuthorityBoundaryFramework();
}

export async function validateAuthorityBoundaryRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body);
}

export async function authorityBoundaryDecisionRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).authorization_decision;
}

export async function authorityBoundaryEvidenceRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).authority_evidence;
}

export async function authorityBoundaryReplayRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).replay;
}

export async function authorityBoundaryLedgerRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).ledger_entry;
}

export async function inspectAuthorityBoundaryRequest(request?: Request) {
  if (!request) return buildAuthorityBoundaryVisibilitySurface();
  const body = await readBody(request);
  return buildAuthorityBoundaryVisibilitySurface(packageFromBody(body));
}
