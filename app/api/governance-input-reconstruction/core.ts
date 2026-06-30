import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildGovernanceInputAuditLog,
  buildGovernanceInputObservabilitySurface,
  computeGovernanceInputPackageHash,
  getGovernanceInputReconstructionContract,
  reconstructGovernanceInputs,
  resolveTruthLedgerInputs,
  validateGovernanceInputPackage,
} from "@/services/governance-input-reconstruction";
import type { GovernanceInputReconstructionInput, GovernanceReplayInputPackage } from "@/types/governance-input-reconstruction";

export async function requireGovernanceInputReconstructionUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function packageFromBody(body: Record<string, unknown>) {
  return (body.package as GovernanceReplayInputPackage | undefined) ?? reconstructGovernanceInputs(body as GovernanceInputReconstructionInput);
}

export function getGovernanceInputReconstructionContractResponse() {
  return getGovernanceInputReconstructionContract();
}

export async function reconstructGovernanceInputsRequest(request: Request) {
  return reconstructGovernanceInputs(await readBody(request) as GovernanceInputReconstructionInput);
}

export async function validateGovernanceInputsRequest(request: Request) {
  const body = await readBody(request);
  return validateGovernanceInputPackage(packageFromBody(body));
}

export async function hashGovernanceInputsRequest(request: Request) {
  const body = await readBody(request);
  const pkg = packageFromBody(body);
  return { governance_input_package_hash: computeGovernanceInputPackageHash(pkg) };
}

export async function truthLedgerInputsRequest(request: Request) {
  const body = await readBody(request);
  return resolveTruthLedgerInputs(packageFromBody(body));
}

export async function governanceContextRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).governance_context;
}

export async function policyContextRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).policy_context;
}

export async function evidenceContextRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).evidence_context;
}

export async function lineageContextRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).lineage_context;
}

export async function configContextRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).configuration_context;
}

export async function auditGovernanceInputsRequest(request: Request) {
  const body = await readBody(request);
  return buildGovernanceInputAuditLog(packageFromBody(body));
}

export async function inspectGovernanceInputsRequest(request?: Request) {
  if (!request) return buildGovernanceInputObservabilitySurface();
  const body = await readBody(request);
  return buildGovernanceInputObservabilitySurface(packageFromBody(body));
}
