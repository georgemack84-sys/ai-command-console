import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { buildGovernanceIsolationObservabilitySurface, getGovernanceIsolationValidationContract, runGovernanceIsolationValidation } from "@/services/governance-isolation-validation";
import type { GovernanceIsolationValidationInput } from "@/types/governance-isolation-validation";

export async function requireGovernanceIsolationValidationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

export function readGovernanceIsolationValidationParams(request: Request): GovernanceIsolationValidationInput {
  const url = new URL(request.url);
  return {
    tenant_id: url.searchParams.get("tenantId") ?? undefined,
    mission_id: url.searchParams.get("missionId") ?? undefined,
    validator_id: url.searchParams.get("validatorId") ?? undefined,
    scenario: (url.searchParams.get("scenario") || undefined) as GovernanceIsolationValidationInput["scenario"],
  };
}

export function reportForRequest(request: Request) {
  return runGovernanceIsolationValidation(readGovernanceIsolationValidationParams(request));
}

export function contractResponse() {
  return getGovernanceIsolationValidationContract();
}

export function observabilityForRequest(request: Request) {
  return buildGovernanceIsolationObservabilitySurface(readGovernanceIsolationValidationParams(request));
}
