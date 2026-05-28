import type {
  PolicyLineageRecord,
  RecommendationLineageError,
  RecommendationLineageInput,
} from "./recommendationLineageStateTypes";
import { trackPolicyConflicts } from "./policyConflictTracker";
import { resolvePolicySnapshot } from "./policySnapshotResolver";
import { validatePolicyLineage } from "./policyLineageValidator";

export function buildPolicyLineage(input: RecommendationLineageInput): {
  record: PolicyLineageRecord;
  conflicts: readonly string[];
  errors: readonly RecommendationLineageError[];
} {
  const record = resolvePolicySnapshot(input);
  return Object.freeze({
    record,
    conflicts: trackPolicyConflicts(record),
    errors: validatePolicyLineage(record),
  });
}
