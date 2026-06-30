import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildBoundaryEnforcementContract,
  buildBoundaryEnforcementObservabilitySurface,
  getBoundaryEnforcementFramework,
  replayBoundaryEnforcementContract,
  validateBoundaryEnforcementContract,
} from "@/services/boundary-enforcement-contract";
import type { BoundaryEnforcementContract, BoundaryEnforcementScenario, BoundaryRequestType } from "@/types/boundary-enforcement-contract";

export async function requireBoundaryEnforcementUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function contractFromBody(body: Record<string, unknown>): BoundaryEnforcementContract {
  return (body.contract as BoundaryEnforcementContract | undefined) ?? buildBoundaryEnforcementContract({
    scenario: body.scenario as BoundaryEnforcementScenario | undefined,
    request_type: body.request_type as BoundaryRequestType | undefined,
  });
}

export function getBoundaryEnforcementContractResponse() {
  return getBoundaryEnforcementFramework();
}

export async function createBoundaryEnforcementContractRequest(request: Request) {
  const body = await readBody(request);
  return contractFromBody(body);
}

export async function validateBoundaryEnforcementContractRequest(request: Request) {
  const body = await readBody(request);
  return validateBoundaryEnforcementContract(contractFromBody(body));
}

export async function replayBoundaryEnforcementContractRequest(request: Request) {
  const body = await readBody(request);
  return replayBoundaryEnforcementContract(contractFromBody(body));
}

export async function boundaryEnforcementLedgerRequest(request: Request) {
  const body = await readBody(request);
  return contractFromBody(body).truth_ledger_entry;
}

export async function inspectBoundaryEnforcementRequest(request?: Request) {
  if (!request) return buildBoundaryEnforcementObservabilitySurface();
  const body = await readBody(request);
  return buildBoundaryEnforcementObservabilitySurface(contractFromBody(body));
}
