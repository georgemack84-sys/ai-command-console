import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { buildGovernanceAuthorityBoundaryObservabilitySurface, getGovernanceAuthorityBoundaryValidationContract, runGovernanceAuthorityBoundaryValidation } from "@/services/governance-authority-boundary-validation";
import type { GovernanceAuthorityBoundaryValidationInput } from "@/types/governance-authority-boundary-validation";

export async function requireGovernanceAuthorityBoundaryValidationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

export function readGovernanceAuthorityBoundaryValidationParams(request: Request): GovernanceAuthorityBoundaryValidationInput {
  const url = new URL(request.url);
  return {
    tenant_id: url.searchParams.get("tenantId") ?? undefined,
    mission_id: url.searchParams.get("missionId") ?? undefined,
    validator_id: url.searchParams.get("validatorId") ?? undefined,
    scenario: (url.searchParams.get("scenario") || undefined) as GovernanceAuthorityBoundaryValidationInput["scenario"],
  };
}

export function reportForRequest(request: Request) {
  return runGovernanceAuthorityBoundaryValidation(readGovernanceAuthorityBoundaryValidationParams(request));
}

export function contractResponse() {
  return getGovernanceAuthorityBoundaryValidationContract();
}

export function observabilityForRequest(request: Request) {
  return buildGovernanceAuthorityBoundaryObservabilitySurface(readGovernanceAuthorityBoundaryValidationParams(request));
}
