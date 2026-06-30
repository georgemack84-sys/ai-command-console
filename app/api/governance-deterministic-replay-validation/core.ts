import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { buildGovernanceDeterministicReplayValidationObservabilitySurface, getGovernanceDeterministicReplayValidationContract, runGovernanceDeterministicReplayValidation } from "@/services/governance-deterministic-replay-validation";
import type { GovernanceDeterministicReplayValidationInput } from "@/types/governance-deterministic-replay-validation";

export async function requireGovernanceDeterministicReplayValidationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

export function readGovernanceDeterministicReplayValidationParams(request: Request): GovernanceDeterministicReplayValidationInput {
  const url = new URL(request.url);
  return {
    tenant_id: url.searchParams.get("tenantId") ?? undefined,
    mission_id: url.searchParams.get("missionId") ?? undefined,
    replay_requestor: url.searchParams.get("replayRequestor") ?? undefined,
    scenario: (url.searchParams.get("scenario") || undefined) as GovernanceDeterministicReplayValidationInput["scenario"],
  };
}

export function reportForRequest(request: Request) {
  return runGovernanceDeterministicReplayValidation(readGovernanceDeterministicReplayValidationParams(request));
}

export function contractResponse() {
  return getGovernanceDeterministicReplayValidationContract();
}

export function observabilityForRequest(request: Request) {
  return buildGovernanceDeterministicReplayValidationObservabilitySurface(readGovernanceDeterministicReplayValidationParams(request));
}
