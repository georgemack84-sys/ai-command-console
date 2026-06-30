import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { buildReplayCertificationVisibilitySurface, getReplayCertificationGateContract, runReplayCertificationGate } from "@/services/replay-certification-gate";
import type { ExecutionReconstructionPackage } from "@/types/autonomous-execution-reconstruction";
import type { PlanningDecisionReconstructionPackage } from "@/types/planning-decision-reconstruction";
import type { ReplayCertificationScenario } from "@/types/replay-certification-gate";
import type { ReplayContractPackage } from "@/types/replay-contract";
import type { SupervisionInterventionReplayPackage } from "@/types/supervision-intervention-replay";

export async function requireReplayCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

async function reportFromRequest(request: Request) {
  const body = await readBody(request);
  return runReplayCertificationGate({
    scenario: body.scenario as ReplayCertificationScenario | undefined,
    replayContractPackage: body.replayContractPackage as ReplayContractPackage | undefined,
    executionReconstructionPackage: body.executionReconstructionPackage as ExecutionReconstructionPackage | undefined,
    planningDecisionReconstructionPackage: body.planningDecisionReconstructionPackage as PlanningDecisionReconstructionPackage | undefined,
    supervisionInterventionReplayPackage: body.supervisionInterventionReplayPackage as SupervisionInterventionReplayPackage | undefined,
  });
}

export function getReplayCertificationContractResponse() { return getReplayCertificationGateContract(); }
export async function certifyReplayRequest(request: Request) { return reportFromRequest(request); }
export async function replayCertificationReportRequest(request: Request) { return reportFromRequest(request); }
export async function replayCertificationEvidenceRequest(request: Request) { return (await reportFromRequest(request)).certification_evidence; }
export async function replayCertificationAuditRequest(request: Request) { return (await reportFromRequest(request)).audit_report; }
export async function replayCertificationReadinessRequest(request: Request) { return (await reportFromRequest(request)).readiness; }
export async function replayCertificationVisibilityRequest(request?: Request) {
  if (!request) return buildReplayCertificationVisibilitySurface();
  const body = await readBody(request);
  return buildReplayCertificationVisibilitySurface({
    scenario: body.scenario as ReplayCertificationScenario | undefined,
    replayContractPackage: body.replayContractPackage as ReplayContractPackage | undefined,
    executionReconstructionPackage: body.executionReconstructionPackage as ExecutionReconstructionPackage | undefined,
    planningDecisionReconstructionPackage: body.planningDecisionReconstructionPackage as PlanningDecisionReconstructionPackage | undefined,
    supervisionInterventionReplayPackage: body.supervisionInterventionReplayPackage as SupervisionInterventionReplayPackage | undefined,
  });
}
