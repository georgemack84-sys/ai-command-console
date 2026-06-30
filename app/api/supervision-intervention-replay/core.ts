import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { buildSupervisionInterventionReplayPackage, buildSupervisionInterventionVisibilitySurface, getSupervisionInterventionReplayFramework } from "@/services/supervision-intervention-replay";
import type { SupervisionInterventionReplayScenario } from "@/types/supervision-intervention-replay";
import type { ReplayContractPackage } from "@/types/replay-contract";

export async function requireSupervisionInterventionReplayUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function packageFromBody(body: Record<string, unknown>) {
  return buildSupervisionInterventionReplayPackage({ scenario: body.scenario as SupervisionInterventionReplayScenario | undefined, sourceReplayContract: body.sourceReplayContract as ReplayContractPackage | undefined });
}
export function getSupervisionInterventionReplayContractResponse() { return getSupervisionInterventionReplayFramework(); }
export async function supervisionReplayRequest(request: Request) { return packageFromBody(await readBody(request)).supervision_timeline; }
export async function interventionReplayRequest(request: Request) { return packageFromBody(await readBody(request)).intervention_timeline; }
export async function healthReplayRequest(request: Request) { return packageFromBody(await readBody(request)).health_timeline; }
export async function governanceReplayRequest(request: Request) { return packageFromBody(await readBody(request)).governance_replay; }
export async function validateSupervisionInterventionReplayRequest(request: Request) { return packageFromBody(await readBody(request)).validation; }
export async function supervisionInterventionReplayPackageRequest(request: Request) { return packageFromBody(await readBody(request)); }
export async function inspectSupervisionInterventionReplayRequest(request?: Request) {
  if (!request) return buildSupervisionInterventionVisibilitySurface();
  return buildSupervisionInterventionVisibilitySurface(packageFromBody(await readBody(request)));
}
