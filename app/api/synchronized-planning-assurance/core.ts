import {
  analyzePlanningConflicts,
  buildPlanningObservabilitySurface,
  computeCompatibilityScore,
  finalizeSynchronizedPlan,
  generateSynchronizedPlan,
  getSynchronizedPlanningAssurance,
  replaySynchronizedPlanning,
  validateDependencies,
  validateObjective,
  validateSequencing,
  validateSynchronizedPlanning,
} from "@/services/synchronized-planning-assurance";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { PlanningContract, PlanningInput } from "@/types/synchronized-planning-assurance";

export async function requireSynchronizedPlanningUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function contractFromBody(body: Record<string, unknown>): PlanningContract {
  return (body.contract as PlanningContract | undefined) ?? generateSynchronizedPlan(body as PlanningInput);
}

export function contractResponse() {
  return getSynchronizedPlanningAssurance();
}

export async function generateRequest(request: Request) {
  return generateSynchronizedPlan((await readBody(request)) as PlanningInput);
}

export async function validateObjectiveRequest(request: Request) {
  return validateObjective((await readBody(request)) as PlanningInput);
}

export async function validateDependenciesRequest(request: Request) {
  return validateDependencies((await readBody(request)) as PlanningInput);
}

export async function validateSequencingRequest(request: Request) {
  return validateSequencing((await readBody(request)) as PlanningInput);
}

export async function analyzeConflictsRequest(request: Request) {
  return analyzePlanningConflicts((await readBody(request)) as PlanningInput);
}

export async function compatibilityScoreRequest(request: Request) {
  return computeCompatibilityScore((await readBody(request)) as PlanningInput);
}

export async function finalizeRequest(request: Request) {
  return finalizeSynchronizedPlan((await readBody(request)) as PlanningInput);
}

export async function replayRequest(request: Request) {
  return replaySynchronizedPlanning(contractFromBody(await readBody(request)));
}

export async function validateRequest(request: Request) {
  return validateSynchronizedPlanning(contractFromBody(await readBody(request)));
}

export async function inspectRequest(request?: Request) {
  if (!request) return buildPlanningObservabilitySurface();
  return buildPlanningObservabilitySurface(contractFromBody(await readBody(request)));
}
