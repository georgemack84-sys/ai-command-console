import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildGovernanceInterfaceAuditLedger,
  buildGovernanceInterfaceTransaction,
  buildGovernanceInterfaceVisibilitySurface,
  getGovernanceInterfacesFramework,
  replayGovernanceInterfaceTransactions,
  validateGovernanceInterfaceTransaction,
} from "@/services/autonomy-governance-interfaces";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import type { GovernanceInterfaceScenario } from "@/types/autonomy-governance-interfaces";

export async function requireGovernanceInterfacesUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getGovernanceInterfacesResponse() {
  return getGovernanceInterfacesFramework();
}

export async function transactionGovernanceInterfacesRequest(request: Request) {
  const body = await readBody(request);
  return buildGovernanceInterfaceTransaction(generateAutonomyIdentity(), body.scenario as GovernanceInterfaceScenario | undefined);
}

export async function validateGovernanceInterfacesRequest(request: Request) {
  const body = await readBody(request);
  const identity = generateAutonomyIdentity();
  const transaction = buildGovernanceInterfaceTransaction(identity, body.scenario as GovernanceInterfaceScenario | undefined);
  return validateGovernanceInterfaceTransaction(identity, transaction);
}

export async function ledgerGovernanceInterfacesRequest(request: Request) {
  const body = await readBody(request);
  const identity = generateAutonomyIdentity();
  const baseline = buildGovernanceInterfaceTransaction(identity);
  const scenario = buildGovernanceInterfaceTransaction(identity, body.scenario as GovernanceInterfaceScenario | undefined);
  return buildGovernanceInterfaceAuditLedger(identity, [baseline, scenario]);
}

export async function replayGovernanceInterfacesRequest(request: Request) {
  const identity = generateAutonomyIdentity();
  const ledger = await ledgerGovernanceInterfacesRequest(request);
  return replayGovernanceInterfaceTransactions(identity, ledger);
}

export async function visibilityGovernanceInterfacesRequest(request: Request) {
  const identity = generateAutonomyIdentity();
  const ledger = await ledgerGovernanceInterfacesRequest(request);
  return buildGovernanceInterfaceVisibilitySurface(identity, ledger);
}
