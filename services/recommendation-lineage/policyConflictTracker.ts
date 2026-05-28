import type { PolicyLineageRecord } from "./recommendationLineageStateTypes";

export function trackPolicyConflicts(record: PolicyLineageRecord): readonly string[] {
  return Object.freeze(record.conflictPolicies);
}
