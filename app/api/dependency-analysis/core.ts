import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  analyzeDependencies,
  buildDependencyIntake,
  buildDependencyVisibilitySurface,
  getDependencyAnalysisFramework,
  replayDependencyGraph,
  validateDependencyGraph,
} from "@/services/dependency-analysis";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { decomposeObjective } from "@/services/objective-decomposition";
import type { DependencyAnalysisScenario } from "@/types/dependency-analysis";

export async function requireDependencyAnalysisUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getDependencyAnalysisResponse() {
  return getDependencyAnalysisFramework();
}

export async function intakeDependencyAnalysisRequest(request: Request) {
  const body = await readBody(request);
  const identity = generateAutonomyIdentity();
  return buildDependencyIntake(identity, decomposeObjective(identity), body.scenario as DependencyAnalysisScenario | undefined);
}

export async function graphDependencyAnalysisRequest(request: Request) {
  const body = await readBody(request);
  const identity = generateAutonomyIdentity();
  return analyzeDependencies(identity, decomposeObjective(identity), body.scenario as DependencyAnalysisScenario | undefined);
}

export async function validateDependencyAnalysisRequest(request: Request) {
  const body = await readBody(request);
  const identity = generateAutonomyIdentity();
  const hierarchy = decomposeObjective(identity);
  return validateDependencyGraph(identity, analyzeDependencies(identity, hierarchy, body.scenario as DependencyAnalysisScenario | undefined), hierarchy);
}

export async function replayDependencyAnalysisRequest(request: Request) {
  const body = await readBody(request);
  const identity = generateAutonomyIdentity();
  return replayDependencyGraph(analyzeDependencies(identity, decomposeObjective(identity), body.scenario as DependencyAnalysisScenario | undefined));
}

export async function visibilityDependencyAnalysisRequest(request: Request) {
  const body = await readBody(request);
  const identity = generateAutonomyIdentity();
  const hierarchy = decomposeObjective(identity);
  return buildDependencyVisibilitySurface(identity, analyzeDependencies(identity, hierarchy, body.scenario as DependencyAnalysisScenario | undefined), hierarchy);
}
