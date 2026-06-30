import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildExecutionReconstructionPackage,
  buildExecutionReconstructionVisibilitySurface,
  getExecutionReconstructionFramework,
} from "@/services/autonomous-execution-reconstruction";
import type { ExecutionReconstructionScenario } from "@/types/autonomous-execution-reconstruction";
import type { ReplayContractPackage } from "@/types/replay-contract";

export async function requireExecutionReconstructionUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function packageFromBody(body: Record<string, unknown>) {
  return buildExecutionReconstructionPackage({
    scenario: body.scenario as ExecutionReconstructionScenario | undefined,
    sourceReplayContract: body.sourceReplayContract as ReplayContractPackage | undefined,
  });
}

export function getExecutionReconstructionContractResponse() {
  return getExecutionReconstructionFramework();
}

export async function reconstructExecutionRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body);
}

export async function executionTimelineRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).timeline;
}

export async function executionStateReplayRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).state_replay;
}

export async function validateExecutionReconstructionRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).validation;
}

export async function executionReconstructionPackageRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body);
}

export async function inspectExecutionReconstructionRequest(request?: Request) {
  if (!request) return buildExecutionReconstructionVisibilitySurface();
  const body = await readBody(request);
  return buildExecutionReconstructionVisibilitySurface(packageFromBody(body));
}
