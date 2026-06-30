import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { buildGovernanceCertificationOrchestratorObservabilitySurface, getGovernanceCertificationOrchestratorContract, runGovernanceCertificationOrchestrator } from "@/services/governance-certification-orchestrator";
import type { GovernanceCertificationOrchestratorInput } from "@/types/governance-certification-orchestrator";

export async function requireGovernanceCertificationOrchestratorUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

export function readGovernanceCertificationOrchestratorParams(request: Request): GovernanceCertificationOrchestratorInput {
  const url = new URL(request.url);
  return {
    tenant_id: url.searchParams.get("tenantId") ?? undefined,
    mission_id: url.searchParams.get("missionId") ?? undefined,
    initiated_by: url.searchParams.get("initiatedBy") ?? "operator_console",
    execution_mode: (url.searchParams.get("mode") || undefined) as GovernanceCertificationOrchestratorInput["execution_mode"],
    scenario: (url.searchParams.get("scenario") || undefined) as GovernanceCertificationOrchestratorInput["scenario"],
  };
}

export function reportForRequest(request: Request) {
  return runGovernanceCertificationOrchestrator(readGovernanceCertificationOrchestratorParams(request));
}

export function contractResponse() {
  return getGovernanceCertificationOrchestratorContract();
}

export function observabilityForRequest(request: Request) {
  return buildGovernanceCertificationOrchestratorObservabilitySurface(readGovernanceCertificationOrchestratorParams(request));
}
