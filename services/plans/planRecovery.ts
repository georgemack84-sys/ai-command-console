import { PLAN_ERROR_CODES } from "./planContracts";
import { getPlan } from "./planPersistence";
import { verifyPlanIntegrity } from "./planIntegrity";

export function preparePlanRecovery(planId: string) {
  const plan = getPlan(planId);
  const integrity = verifyPlanIntegrity(planId);
  const recoverable = integrity.valid && ["FAILED", "DISPUTED", "FROZEN"].includes(plan.lifecycleState);

  return {
    planId,
    recoverable,
    requiresOperatorReview: !recoverable || plan.lifecycleState === "FROZEN",
    reasons: recoverable ? [] : Array.from(new Set([...integrity.reasons, PLAN_ERROR_CODES.PLAN_RECOVERY_FAILED])),
  };
}
