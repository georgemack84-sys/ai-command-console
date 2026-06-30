import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildRecoveryPlanningObservabilitySurface,
  generateRecoveryPlans,
  getRecoveryPlanningEngineContract,
  replayRecoveryPlanningPackage,
  validateRecoveryPlanningPackage,
} from "@/services/recovery-planning-engine";
import type { RecoveryPlanningInput, RecoveryPlanningPackage } from "@/types/recovery-planning-engine";

export async function requireRecoveryPlanningUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): RecoveryPlanningInput {
  return body as RecoveryPlanningInput;
}

function packageFromBody(body: Record<string, unknown>): RecoveryPlanningPackage {
  return (body.planning_package as RecoveryPlanningPackage | undefined) ?? generateRecoveryPlans(inputFromBody(body));
}

export function contractResponse() { return getRecoveryPlanningEngineContract(); }
export async function plansRequest(request: Request) { return generateRecoveryPlans(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateRecoveryPlanningPackage(packageFromBody(await readBody(request))); }
export async function evaluateRequest(request: Request) {
  const pkg = packageFromBody(await readBody(request));
  return {
    planning_id: pkg.planning_id,
    evaluations: pkg.plans.map((plan) => ({ plan_id: plan.recovery_plan_id, strategy_type: plan.strategy_type, evaluation: plan.evaluation })),
    selected_plan_id: pkg.selected_plan.recovery_plan_id,
  };
}
export async function rankRequest(request: Request) {
  const pkg = packageFromBody(await readBody(request));
  return {
    planning_id: pkg.planning_id,
    ranking_factors: pkg.ranking_factors,
    ranked_plans: pkg.plans.map((plan) => ({ rank: plan.rank, plan_id: plan.recovery_plan_id, strategy_type: plan.strategy_type, score: plan.evaluation.evaluation_score, risk: plan.operational_risk })),
  };
}
export async function replayRequest(request: Request) { return replayRecoveryPlanningPackage(packageFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildRecoveryPlanningObservabilitySurface();
  return buildRecoveryPlanningObservabilitySurface(packageFromBody(await readBody(request)));
}
