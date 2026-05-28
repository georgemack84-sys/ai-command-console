import { getPlanHistory } from "./planPersistence";

export function inspectPlanRetention(planId: string) {
  const history = getPlanHistory(planId);
  return {
    planId,
    retain: true,
    lifecycleEventCount: history.lifecycleEvents.length,
    auditRequired: true,
    destructiveDeletionAllowed: false,
  };
}
