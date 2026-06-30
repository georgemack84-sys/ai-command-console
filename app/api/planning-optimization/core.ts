import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { decomposeObjective } from "@/services/objective-decomposition";
import { analyzeDependencies } from "@/services/dependency-analysis";
import {
  buildOptimizationIntake,
  buildOptimizationVisibilitySurface,
  getPlanningOptimizationFramework,
  loadOptimizationConstraints,
  optimizePlan,
  replayOptimizedPlan,
  validateOptimizedPlan,
} from "@/services/planning-optimization";
import type { OptimizationScenario } from "@/types/planning-optimization";

export async function requirePlanningOptimizationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function buildPlanningInputs(scenario?: OptimizationScenario) {
  const identity = generateAutonomyIdentity();
  const hierarchy = decomposeObjective(identity);
  const graph = analyzeDependencies(identity, hierarchy);
  const intake = buildOptimizationIntake(identity, hierarchy, graph, scenario);
  return { identity, hierarchy, graph, intake };
}

export function getPlanningOptimizationResponse() {
  return getPlanningOptimizationFramework();
}

export async function intakePlanningOptimizationRequest(request: Request) {
  const body = await readBody(request);
  const { intake } = buildPlanningInputs(body.scenario as OptimizationScenario | undefined);
  return intake;
}

export async function constraintsPlanningOptimizationRequest(request: Request) {
  const body = await readBody(request);
  const scenario = body.scenario as OptimizationScenario | undefined;
  const { intake } = buildPlanningInputs(scenario);
  return loadOptimizationConstraints(intake, scenario);
}

export async function planPlanningOptimizationRequest(request: Request) {
  const body = await readBody(request);
  const scenario = body.scenario as OptimizationScenario | undefined;
  const { identity, hierarchy, graph } = buildPlanningInputs(scenario);
  return optimizePlan(identity, hierarchy, graph, scenario);
}

export async function validatePlanningOptimizationRequest(request: Request) {
  const body = await readBody(request);
  const scenario = body.scenario as OptimizationScenario | undefined;
  const { identity, hierarchy, graph } = buildPlanningInputs(scenario);
  return validateOptimizedPlan(identity, optimizePlan(identity, hierarchy, graph, scenario), graph);
}

export async function replayPlanningOptimizationRequest(request: Request) {
  const body = await readBody(request);
  const scenario = body.scenario as OptimizationScenario | undefined;
  const { identity, hierarchy, graph } = buildPlanningInputs(scenario);
  return replayOptimizedPlan(optimizePlan(identity, hierarchy, graph, scenario));
}

export async function visibilityPlanningOptimizationRequest(request: Request) {
  const body = await readBody(request);
  const scenario = body.scenario as OptimizationScenario | undefined;
  const { identity, hierarchy, graph } = buildPlanningInputs(scenario);
  return buildOptimizationVisibilitySurface(identity, optimizePlan(identity, hierarchy, graph, scenario), graph);
}
