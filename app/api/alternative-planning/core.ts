import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { decomposeObjective } from "@/services/objective-decomposition";
import { analyzeDependencies } from "@/services/dependency-analysis";
import { optimizePlan } from "@/services/planning-optimization";
import {
  buildAlternativePlanningIntake,
  buildAlternativePlanningPackage,
  buildAlternativePlanningVisibilitySurface,
  generateAlternativeStrategies,
  getAlternativePlanningFramework,
  loadAlternativePlanningConstraints,
  replayAlternativePlanningPackage,
  validateAlternativePlanningPackage,
} from "@/services/alternative-planning";
import type { AlternativePlanningScenario } from "@/types/alternative-planning";

export async function requireAlternativePlanningUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function buildAlternativeInputs(scenario?: AlternativePlanningScenario) {
  const identity = generateAutonomyIdentity();
  const hierarchy = decomposeObjective(identity);
  const graph = analyzeDependencies(identity, hierarchy);
  const optimizedPlan = optimizePlan(identity, hierarchy, graph);
  const intake = buildAlternativePlanningIntake(identity, optimizedPlan, graph, scenario);
  return { identity, graph, optimizedPlan, intake };
}

export function getAlternativePlanningResponse() {
  return getAlternativePlanningFramework();
}

export async function intakeAlternativePlanningRequest(request: Request) {
  const body = await readBody(request);
  const { intake } = buildAlternativeInputs(body.scenario as AlternativePlanningScenario | undefined);
  return intake;
}

export async function constraintsAlternativePlanningRequest(request: Request) {
  const body = await readBody(request);
  const scenario = body.scenario as AlternativePlanningScenario | undefined;
  const { intake } = buildAlternativeInputs(scenario);
  return loadAlternativePlanningConstraints(intake, scenario);
}

export async function strategiesAlternativePlanningRequest(request: Request) {
  const body = await readBody(request);
  const scenario = body.scenario as AlternativePlanningScenario | undefined;
  const { intake } = buildAlternativeInputs(scenario);
  return generateAlternativeStrategies(intake, scenario);
}

export async function catalogAlternativePlanningRequest(request: Request) {
  const body = await readBody(request);
  const scenario = body.scenario as AlternativePlanningScenario | undefined;
  const { identity, optimizedPlan, graph } = buildAlternativeInputs(scenario);
  return buildAlternativePlanningPackage(identity, optimizedPlan, graph, scenario);
}

export async function validateAlternativePlanningRequest(request: Request) {
  const body = await readBody(request);
  const scenario = body.scenario as AlternativePlanningScenario | undefined;
  const { identity, optimizedPlan, graph } = buildAlternativeInputs(scenario);
  return validateAlternativePlanningPackage(buildAlternativePlanningPackage(identity, optimizedPlan, graph, scenario));
}

export async function replayAlternativePlanningRequest(request: Request) {
  const body = await readBody(request);
  const scenario = body.scenario as AlternativePlanningScenario | undefined;
  const { identity, optimizedPlan, graph } = buildAlternativeInputs(scenario);
  return replayAlternativePlanningPackage(buildAlternativePlanningPackage(identity, optimizedPlan, graph, scenario));
}

export async function visibilityAlternativePlanningRequest(request: Request) {
  const body = await readBody(request);
  const scenario = body.scenario as AlternativePlanningScenario | undefined;
  const { identity, optimizedPlan, graph } = buildAlternativeInputs(scenario);
  return buildAlternativePlanningVisibilitySurface(buildAlternativePlanningPackage(identity, optimizedPlan, graph, scenario));
}
