import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildGovernanceStateAuditLog,
  buildGovernanceStateObservabilitySurface,
  computeGovernanceStatePackageHash,
  getGovernanceStateReconstructionContract,
  reconstructGovernanceState,
  validateGovernanceStatePackage,
} from "@/services/governance-state-reconstruction";
import type { GovernanceReplayStatePackage, GovernanceStateReconstructionInput } from "@/types/governance-state-reconstruction";

export async function requireGovernanceStateReconstructionUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function packageFromBody(body: Record<string, unknown>) {
  return (body.package as GovernanceReplayStatePackage | undefined) ?? reconstructGovernanceState(body as GovernanceStateReconstructionInput);
}

export function getGovernanceStateReconstructionContractResponse() {
  return getGovernanceStateReconstructionContract();
}

export async function reconstructGovernanceStateRequest(request: Request) {
  return reconstructGovernanceState(await readBody(request) as GovernanceStateReconstructionInput);
}

export async function validateGovernanceStateRequest(request: Request) {
  const body = await readBody(request);
  return validateGovernanceStatePackage(packageFromBody(body));
}

export async function hashGovernanceStateRequest(request: Request) {
  const body = await readBody(request);
  return { governance_state_package_hash: computeGovernanceStatePackageHash(packageFromBody(body)) };
}

export async function executionStateRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).execution_state;
}

export async function policyStateRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).policy_state;
}

export async function confidenceStateRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).confidence_state;
}

export async function lineageStateRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).lineage_state;
}

export async function transitionsRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).transitions;
}

export async function auditGovernanceStateRequest(request: Request) {
  const body = await readBody(request);
  return buildGovernanceStateAuditLog(packageFromBody(body));
}

export async function inspectGovernanceStateRequest(request?: Request) {
  if (!request) return buildGovernanceStateObservabilitySurface();
  const body = await readBody(request);
  return buildGovernanceStateObservabilitySurface(packageFromBody(body));
}
