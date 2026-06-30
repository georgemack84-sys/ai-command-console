import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { buildGovernanceIntegrityValidationObservabilitySurface, getGovernanceIntegrityValidationContract, runGovernanceIntegrityValidation } from "@/services/governance-integrity-validation";
import type { GovernanceIntegrityValidationInput } from "@/types/governance-integrity-validation";

export async function requireGovernanceIntegrityValidationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

export function readGovernanceIntegrityValidationParams(request: Request): GovernanceIntegrityValidationInput {
  const url = new URL(request.url);
  return {
    tenant_id: url.searchParams.get("tenantId") ?? undefined,
    mission_id: url.searchParams.get("missionId") ?? undefined,
    validator_id: url.searchParams.get("validatorId") ?? undefined,
    scenario: (url.searchParams.get("scenario") || undefined) as GovernanceIntegrityValidationInput["scenario"],
  };
}

export function reportForRequest(request: Request) {
  return runGovernanceIntegrityValidation(readGovernanceIntegrityValidationParams(request));
}

export function contractResponse() {
  return getGovernanceIntegrityValidationContract();
}

export function observabilityForRequest(request: Request) {
  return buildGovernanceIntegrityValidationObservabilitySurface(readGovernanceIntegrityValidationParams(request));
}
