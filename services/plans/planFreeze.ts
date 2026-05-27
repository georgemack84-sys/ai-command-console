import { PLAN_ERROR_CODES } from "./planContracts";
import { getPlan } from "./planPersistence";
import { transitionPlanLifecycle } from "./planLifecycleManager";

export function freezePlan(planId: string, reason: string, actor: "system" | "user" | "operator" = "operator") {
  const plan = getPlan(planId);
  if (plan.lifecycleState === "FROZEN") {
    return plan;
  }
  return transitionPlanLifecycle({
    planId,
    fromState: plan.lifecycleState,
    toState: "FROZEN",
    actor,
    reason,
  }).plan;
}

export function isPlanFrozen(planId: string) {
  return getPlan(planId).lifecycleState === "FROZEN";
}

export function enforceFreezeProtection(planId: string) {
  const plan = getPlan(planId);
  if (plan.lifecycleState === "FROZEN") {
    throw new Error(PLAN_ERROR_CODES.PLAN_FROZEN_BY_GOVERNANCE);
  }
}
