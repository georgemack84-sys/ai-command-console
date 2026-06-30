import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { buildGovernanceCompletionGateObservabilitySurface, getGovernanceIntelligenceCompletionGateContract, runGovernanceIntelligenceCompletionGate } from "@/services/governance-intelligence-completion-gate";
import type { GovernanceCompletionGateInput } from "@/types/governance-intelligence-completion-gate";

export async function requireGovernanceCompletionGateUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

export function readGovernanceCompletionGateParams(request: Request): GovernanceCompletionGateInput {
  const url = new URL(request.url);
  return {
    tenant_id: url.searchParams.get("tenantId") ?? undefined,
    mission_id: url.searchParams.get("missionId") ?? undefined,
    validator_id: url.searchParams.get("validatorId") ?? undefined,
    scenario: (url.searchParams.get("scenario") || undefined) as GovernanceCompletionGateInput["scenario"],
  };
}

export function reportForRequest(request: Request) {
  return runGovernanceIntelligenceCompletionGate(readGovernanceCompletionGateParams(request));
}

export function contractResponse() {
  return getGovernanceIntelligenceCompletionGateContract();
}

export function observabilityForRequest(request: Request) {
  return buildGovernanceCompletionGateObservabilitySurface(readGovernanceCompletionGateParams(request));
}
