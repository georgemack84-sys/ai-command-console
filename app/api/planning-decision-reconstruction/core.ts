import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { buildPlanningDecisionReconstructionPackage, buildPlanningDecisionVisibilitySurface, getPlanningDecisionReconstructionFramework } from "@/services/planning-decision-reconstruction";
import type { PlanningDecisionReconstructionScenario } from "@/types/planning-decision-reconstruction";
import type { ReplayContractPackage } from "@/types/replay-contract";

export async function requirePlanningDecisionReconstructionUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function packageFromBody(body: Record<string, unknown>) {
  return buildPlanningDecisionReconstructionPackage({ scenario: body.scenario as PlanningDecisionReconstructionScenario | undefined, sourceReplayContract: body.sourceReplayContract as ReplayContractPackage | undefined });
}
export function getPlanningDecisionReconstructionContractResponse() { return getPlanningDecisionReconstructionFramework(); }
export async function planningReplayRequest(request: Request) { return packageFromBody(await readBody(request)).planning_replay; }
export async function decisionReplayRequest(request: Request) { return packageFromBody(await readBody(request)).decision_replay; }
export async function delegationReplayRequest(request: Request) { return packageFromBody(await readBody(request)).delegation_replay; }
export async function reasoningReplayRequest(request: Request) { return packageFromBody(await readBody(request)).reasoning_replay; }
export async function validatePlanningDecisionReconstructionRequest(request: Request) { return packageFromBody(await readBody(request)).validation; }
export async function planningDecisionReconstructionPackageRequest(request: Request) { return packageFromBody(await readBody(request)); }
export async function inspectPlanningDecisionReconstructionRequest(request?: Request) {
  if (!request) return buildPlanningDecisionVisibilitySurface();
  return buildPlanningDecisionVisibilitySurface(packageFromBody(await readBody(request)));
}
