import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { buildReplayContractPackage, buildReplayContractVisibilitySurface, getReplayContractFramework } from "@/services/replay-contract";
import type { BoundaryCertificationReport } from "@/types/boundary-certification-gate";
import type { ReplayContractScenario, ReplayScope, ReplayType } from "@/types/replay-contract";

export async function requireReplayContractUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function packageFromBody(body: Record<string, unknown>) {
  return buildReplayContractPackage({
    scenario: body.scenario as ReplayContractScenario | undefined,
    sourceBoundaryCertification: body.sourceBoundaryCertification as BoundaryCertificationReport | undefined,
    replay_type: body.replay_type as ReplayType | undefined,
    replay_scope: body.replay_scope as ReplayScope | undefined,
  });
}

export function getReplayContractResponse() {
  return getReplayContractFramework();
}

export async function registerReplayRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).replay_identity;
}

export async function replayArtifactDiscoveryRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).artifact_manifest;
}

export async function validateReplayContractRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).validation;
}

export async function replayContractPackageRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body);
}

export async function inspectReplayContractRequest(request?: Request) {
  if (!request) return buildReplayContractVisibilitySurface();
  const body = await readBody(request);
  return buildReplayContractVisibilitySurface(packageFromBody(body));
}
