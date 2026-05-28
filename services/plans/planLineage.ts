import { PLAN_ERROR_CODES } from "./planContracts";
import { getPlanHistory } from "./planPersistence";

export function rebuildPlanLineage(planId: string) {
  const history = getPlanHistory(planId);
  const lineage = history.plan.lineage;
  const issues = [
    ...(lineage.parentPlanId === planId ? [PLAN_ERROR_CODES.PLAN_LINEAGE_CORRUPTED] : []),
    ...(lineage.replayOf === planId ? [PLAN_ERROR_CODES.PLAN_LINEAGE_CORRUPTED] : []),
    ...(lineage.derivedFrom === planId ? [PLAN_ERROR_CODES.PLAN_LINEAGE_CORRUPTED] : []),
  ];

  return {
    planId,
    lineage,
    valid: issues.length === 0,
    issues,
  };
}
