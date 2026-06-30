import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildOrchestrationCertificationObservabilitySurface,
  getOrchestrationCertificationGateContract,
  runOrchestrationCertificationGate,
} from "@/services/orchestration-certification-gate";
import type { OrchestrationCertificationGateInput } from "@/types/orchestration-certification-gate";

export async function requireOrchestrationCertificationGateUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

export function readOrchestrationCertificationGateParams(request: Request): OrchestrationCertificationGateInput {
  const url = new URL(request.url);
  return {
    tenant_id: url.searchParams.get("tenantId") ?? undefined,
    mission_id: url.searchParams.get("missionId") ?? undefined,
    validator_id: url.searchParams.get("validatorId") ?? undefined,
    scenario: (url.searchParams.get("scenario") || undefined) as OrchestrationCertificationGateInput["scenario"],
  };
}

export function reportForRequest(request: Request) {
  return runOrchestrationCertificationGate(readOrchestrationCertificationGateParams(request));
}

export function contractResponse() {
  return getOrchestrationCertificationGateContract();
}

export function observabilityForRequest(request: Request) {
  return buildOrchestrationCertificationObservabilitySurface(readOrchestrationCertificationGateParams(request));
}
