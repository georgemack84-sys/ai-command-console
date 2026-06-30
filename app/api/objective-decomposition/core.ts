import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildMissionObjective,
  buildObjectiveVisibilitySurface,
  decomposeObjective,
  getObjectiveDecompositionFramework,
  interpretObjective,
  replayObjectiveDecomposition,
  validateObjectiveHierarchy,
} from "@/services/objective-decomposition";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import type { ObjectiveDecompositionScenario } from "@/types/objective-decomposition";

export async function requireObjectiveDecompositionUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getObjectiveDecompositionResponse() {
  return getObjectiveDecompositionFramework();
}

export async function objectiveRequest(request: Request) {
  const body = await readBody(request);
  return buildMissionObjective(generateAutonomyIdentity(), body.scenario as ObjectiveDecompositionScenario | undefined);
}

export async function interpretObjectiveRequest(request: Request) {
  const body = await readBody(request);
  const identity = generateAutonomyIdentity();
  return interpretObjective(buildMissionObjective(identity, body.scenario as ObjectiveDecompositionScenario | undefined));
}

export async function decomposeObjectiveRequest(request: Request) {
  const body = await readBody(request);
  return decomposeObjective(generateAutonomyIdentity(), body.scenario as ObjectiveDecompositionScenario | undefined);
}

export async function validateObjectiveRequest(request: Request) {
  const body = await readBody(request);
  const identity = generateAutonomyIdentity();
  const hierarchy = decomposeObjective(identity, body.scenario as ObjectiveDecompositionScenario | undefined);
  return validateObjectiveHierarchy(identity, hierarchy);
}

export async function replayObjectiveRequest(request: Request) {
  const body = await readBody(request);
  return replayObjectiveDecomposition(decomposeObjective(generateAutonomyIdentity(), body.scenario as ObjectiveDecompositionScenario | undefined));
}

export async function visibilityObjectiveRequest(request: Request) {
  const body = await readBody(request);
  const identity = generateAutonomyIdentity();
  const hierarchy = decomposeObjective(identity, body.scenario as ObjectiveDecompositionScenario | undefined);
  return buildObjectiveVisibilitySurface(identity, hierarchy);
}
