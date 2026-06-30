import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { decomposeObjective } from "@/services/objective-decomposition";
import { analyzeDependencies } from "@/services/dependency-analysis";
import { optimizePlan } from "@/services/planning-optimization";
import { buildAlternativePlanningPackage } from "@/services/alternative-planning";
import { buildContingencyPlanningPackage } from "@/services/contingency-planning";
import {
  buildPlanningConfidenceAssessment,
  buildPlanningConfidenceIntake,
  buildPlanningConfidenceVisibilitySurface,
  evaluateConfidenceFactors,
  getPlanningConfidenceFramework,
  replayPlanningConfidenceAssessment,
  validatePlanningConfidenceAssessment,
} from "@/services/planning-confidence";
import type { PlanningConfidenceScenario } from "@/types/planning-confidence";

export async function requirePlanningConfidenceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function buildConfidenceInputs(scenario?: PlanningConfidenceScenario) {
  const identity = generateAutonomyIdentity();
  const hierarchy = decomposeObjective(identity);
  const graph = analyzeDependencies(identity, hierarchy);
  const optimizedPlan = optimizePlan(identity, hierarchy, graph);
  const alternativePackage = buildAlternativePlanningPackage(identity, optimizedPlan, graph);
  const contingencyPackage = buildContingencyPlanningPackage(identity, optimizedPlan, alternativePackage, graph);
  const intake = buildPlanningConfidenceIntake(identity, hierarchy, graph, optimizedPlan, alternativePackage, contingencyPackage, scenario);
  return { identity, hierarchy, graph, optimizedPlan, alternativePackage, contingencyPackage, intake };
}

export function getPlanningConfidenceResponse() {
  return getPlanningConfidenceFramework();
}

export async function intakePlanningConfidenceRequest(request: Request) {
  const body = await readBody(request);
  return buildConfidenceInputs(body.scenario as PlanningConfidenceScenario | undefined).intake;
}

export async function factorsPlanningConfidenceRequest(request: Request) {
  const body = await readBody(request);
  const scenario = body.scenario as PlanningConfidenceScenario | undefined;
  const { intake } = buildConfidenceInputs(scenario);
  return evaluateConfidenceFactors(intake, scenario);
}

export async function assessmentPlanningConfidenceRequest(request: Request) {
  const body = await readBody(request);
  const scenario = body.scenario as PlanningConfidenceScenario | undefined;
  const { identity, hierarchy, graph, optimizedPlan, alternativePackage, contingencyPackage } = buildConfidenceInputs(scenario);
  return buildPlanningConfidenceAssessment(identity, hierarchy, graph, optimizedPlan, alternativePackage, contingencyPackage, scenario);
}

export async function validatePlanningConfidenceRequest(request: Request) {
  return validatePlanningConfidenceAssessment(await assessmentPlanningConfidenceRequest(request));
}

export async function replayPlanningConfidenceRequest(request: Request) {
  return replayPlanningConfidenceAssessment(await assessmentPlanningConfidenceRequest(request));
}

export async function visibilityPlanningConfidenceRequest(request: Request) {
  return buildPlanningConfidenceVisibilitySurface(await assessmentPlanningConfidenceRequest(request));
}
