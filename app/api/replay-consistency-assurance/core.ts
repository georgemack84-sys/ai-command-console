import {
  buildReplayConsistencyObservabilitySurface,
  compareReplay,
  generateReplayReport,
  getReplayConsistencyAssurance,
  replayCommunication,
  replayDelegation,
  replayPlanning,
  replaySharedState,
  startReplay,
  validateReplayConsistency,
} from "@/services/replay-consistency-assurance";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ReplayConsistencyInput, ReplayConsistencySession } from "@/types/replay-consistency-assurance";

export async function requireReplayConsistencyUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function sessionFromBody(body: Record<string, unknown>): ReplayConsistencySession {
  return (body.session as ReplayConsistencySession | undefined) ?? startReplay(body as ReplayConsistencyInput);
}

export function contractResponse() { return getReplayConsistencyAssurance(); }
export async function startRequest(request: Request) { return startReplay((await readBody(request)) as ReplayConsistencyInput); }
export async function replayPlanningRequest(request: Request) { return replayPlanning((await readBody(request)) as ReplayConsistencyInput); }
export async function replayDelegationRequest(request: Request) { return replayDelegation((await readBody(request)) as ReplayConsistencyInput); }
export async function replayCommunicationRequest(request: Request) { return replayCommunication((await readBody(request)) as ReplayConsistencyInput); }
export async function replaySharedStateRequest(request: Request) { return replaySharedState((await readBody(request)) as ReplayConsistencyInput); }
export async function compareRequest(request: Request) { return compareReplay((await readBody(request)) as ReplayConsistencyInput); }
export async function reportRequest(request: Request) { return generateReplayReport((await readBody(request)) as ReplayConsistencyInput); }
export async function validateRequest(request: Request) { return validateReplayConsistency(sessionFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildReplayConsistencyObservabilitySurface();
  return buildReplayConsistencyObservabilitySurface(sessionFromBody(await readBody(request)));
}
