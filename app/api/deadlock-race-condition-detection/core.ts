import {
  analyzeWaitGraph,
  buildDeadlockRaceObservabilitySurface,
  detectDelegationLoops,
  detectRaceWindows,
  generateBlockedAgentGraph,
  generateDependencyLockMap,
  getDeadlockRaceDetection,
  recommendRecovery,
  validateDeadlockRaceDetection,
  validateStateUpdates,
} from "@/services/deadlock-race-condition-detection";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { DeadlockRaceAnalysis, DeadlockRaceInput } from "@/types/deadlock-race-condition-detection";

export async function requireDeadlockRaceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function analysisFromBody(body: Record<string, unknown>): DeadlockRaceAnalysis {
  return (body.analysis as DeadlockRaceAnalysis | undefined) ?? analyzeWaitGraph(body as DeadlockRaceInput);
}

export function contractResponse() { return getDeadlockRaceDetection(); }
export async function analyzeWaitGraphRequest(request: Request) { return analyzeWaitGraph((await readBody(request)) as DeadlockRaceInput); }
export async function detectRaceWindowsRequest(request: Request) { return detectRaceWindows((await readBody(request)) as DeadlockRaceInput); }
export async function validateStateUpdatesRequest(request: Request) { return validateStateUpdates((await readBody(request)) as DeadlockRaceInput); }
export async function detectDelegationLoopsRequest(request: Request) { return detectDelegationLoops((await readBody(request)) as DeadlockRaceInput); }
export async function blockedAgentGraphRequest(request: Request) { return generateBlockedAgentGraph((await readBody(request)) as DeadlockRaceInput); }
export async function dependencyLockMapRequest(request: Request) { return generateDependencyLockMap((await readBody(request)) as DeadlockRaceInput); }
export async function recommendRecoveryRequest(request: Request) { return recommendRecovery((await readBody(request)) as DeadlockRaceInput); }
export async function validateRequest(request: Request) { return validateDeadlockRaceDetection(analysisFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildDeadlockRaceObservabilitySurface();
  return buildDeadlockRaceObservabilitySurface(analysisFromBody(await readBody(request)));
}
