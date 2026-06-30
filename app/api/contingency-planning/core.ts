import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { decomposeObjective } from "@/services/objective-decomposition";
import { analyzeDependencies } from "@/services/dependency-analysis";
import { optimizePlan } from "@/services/planning-optimization";
import { buildAlternativePlanningPackage } from "@/services/alternative-planning";
import {
  analyzeFailureScenarios,
  buildContingencyIntake,
  buildContingencyPlanningPackage,
  buildContingencyVisibilitySurface,
  buildRecoveryDecisionMatrix,
  buildRecoveryPlans,
  getContingencyPlanningFramework,
  replayContingencyPlanningPackage,
  validateContingencyPlanningPackage,
} from "@/services/contingency-planning";
import type { ContingencyPlanningScenario } from "@/types/contingency-planning";

export async function requireContingencyPlanningUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function buildContingencyInputs(scenario?: ContingencyPlanningScenario) {
  const identity = generateAutonomyIdentity();
  const hierarchy = decomposeObjective(identity);
  const graph = analyzeDependencies(identity, hierarchy);
  const optimizedPlan = optimizePlan(identity, hierarchy, graph);
  const alternativePackage = buildAlternativePlanningPackage(identity, optimizedPlan, graph);
  const intake = buildContingencyIntake(identity, optimizedPlan, alternativePackage, graph, scenario);
  return { identity, graph, optimizedPlan, alternativePackage, intake };
}

export function getContingencyPlanningResponse() {
  return getContingencyPlanningFramework();
}

export async function intakeContingencyPlanningRequest(request: Request) {
  const body = await readBody(request);
  return buildContingencyInputs(body.scenario as ContingencyPlanningScenario | undefined).intake;
}

export async function scenariosContingencyPlanningRequest(request: Request) {
  const body = await readBody(request);
  return analyzeFailureScenarios(buildContingencyInputs(body.scenario as ContingencyPlanningScenario | undefined).intake);
}

export async function plansContingencyPlanningRequest(request: Request) {
  const body = await readBody(request);
  const scenario = body.scenario as ContingencyPlanningScenario | undefined;
  return buildRecoveryPlans(buildContingencyInputs(scenario).intake, scenario);
}

export async function matrixContingencyPlanningRequest() {
  return buildRecoveryDecisionMatrix();
}

export async function catalogContingencyPlanningRequest(request: Request) {
  const body = await readBody(request);
  const scenario = body.scenario as ContingencyPlanningScenario | undefined;
  const { identity, optimizedPlan, alternativePackage, graph } = buildContingencyInputs(scenario);
  return buildContingencyPlanningPackage(identity, optimizedPlan, alternativePackage, graph, scenario);
}

export async function validateContingencyPlanningRequest(request: Request) {
  return validateContingencyPlanningPackage(await catalogContingencyPlanningRequest(request));
}

export async function replayContingencyPlanningRequest(request: Request) {
  return replayContingencyPlanningPackage(await catalogContingencyPlanningRequest(request));
}

export async function visibilityContingencyPlanningRequest(request: Request) {
  return buildContingencyVisibilitySurface(await catalogContingencyPlanningRequest(request));
}
