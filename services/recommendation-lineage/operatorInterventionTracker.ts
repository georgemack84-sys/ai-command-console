import type { ApprovalLineageRecord } from "./recommendationLineageStateTypes";

export function trackOperatorInterventions(record: ApprovalLineageRecord): readonly string[] {
  return Object.freeze(record.operatorInterventions);
}
