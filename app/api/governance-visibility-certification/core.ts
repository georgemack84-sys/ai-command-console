import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { buildGovernanceVisibilityCertificationObservabilitySurface, getGovernanceVisibilityCertificationContract, runGovernanceVisibilityCertification } from "@/services/governance-visibility-certification";
import type { GovernanceVisibilityCertificationInput } from "@/types/governance-visibility-certification";

export async function requireGovernanceVisibilityCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

export function readGovernanceVisibilityCertificationParams(request: Request): GovernanceVisibilityCertificationInput {
  const url = new URL(request.url);
  return {
    tenant_id: url.searchParams.get("tenantId") ?? undefined,
    mission_id: url.searchParams.get("missionId") ?? undefined,
    operator_id: url.searchParams.get("operatorId") ?? "operator_console",
    scenario: (url.searchParams.get("scenario") || undefined) as GovernanceVisibilityCertificationInput["scenario"],
  };
}

export function reportForRequest(request: Request) {
  return runGovernanceVisibilityCertification(readGovernanceVisibilityCertificationParams(request));
}

export function contractResponse() {
  return getGovernanceVisibilityCertificationContract();
}

export function observabilityForRequest(request: Request) {
  return buildGovernanceVisibilityCertificationObservabilitySurface(reportForRequest(request));
}
