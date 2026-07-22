import {
  buildSharedGovernanceObservabilitySurface,
  finalizeSharedGovernance,
  generateGovernanceInfluenceGraph,
  getSharedGovernanceAssurance,
  loadSharedGovernanceContext,
  replaySharedGovernance,
  validateConstitutionalContext,
  validateGovernanceEvidence,
  validateGovernanceReplay,
  validatePolicySynchronization,
  validateSharedGovernance,
} from "@/services/shared-governance-assurance";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { SharedGovernanceContract, SharedGovernanceInput } from "@/types/shared-governance-assurance";

export async function requireSharedGovernanceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function contractFromBody(body: Record<string, unknown>): SharedGovernanceContract {
  return (body.contract as SharedGovernanceContract | undefined) ?? loadSharedGovernanceContext(body as SharedGovernanceInput);
}

export function contractResponse() { return getSharedGovernanceAssurance(); }
export async function loadContextRequest(request: Request) { return loadSharedGovernanceContext((await readBody(request)) as SharedGovernanceInput); }
export async function validatePolicySynchronizationRequest(request: Request) { return validatePolicySynchronization((await readBody(request)) as SharedGovernanceInput); }
export async function validateConstitutionalContextRequest(request: Request) { return validateConstitutionalContext((await readBody(request)) as SharedGovernanceInput); }
export async function validateEvidenceRequest(request: Request) { return validateGovernanceEvidence((await readBody(request)) as SharedGovernanceInput); }
export async function influenceGraphRequest(request: Request) { return generateGovernanceInfluenceGraph((await readBody(request)) as SharedGovernanceInput); }
export async function validateReplayRequest(request: Request) { return validateGovernanceReplay((await readBody(request)) as SharedGovernanceInput); }
export async function finalizeRequest(request: Request) { return finalizeSharedGovernance((await readBody(request)) as SharedGovernanceInput); }
export async function replayRequest(request: Request) { return replaySharedGovernance(contractFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateSharedGovernance(contractFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildSharedGovernanceObservabilitySurface();
  return buildSharedGovernanceObservabilitySurface(contractFromBody(await readBody(request)));
}
