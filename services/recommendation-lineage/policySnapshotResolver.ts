import type {
  PolicyLineageRecord,
  RecommendationLineageInput,
} from "./recommendationLineageStateTypes";
import { hashRecommendationLineageValue } from "./lineageGraphHasher";

export function resolvePolicySnapshot(input: RecommendationLineageInput): PolicyLineageRecord {
  return Object.freeze({
    policySnapshotId: input.policySnapshot.policySnapshotId,
    applicablePolicies: Object.freeze(input.policySnapshot.applicablePolicies),
    inheritedPolicies: Object.freeze(input.policySnapshot.inheritedPolicies),
    overriddenPolicies: Object.freeze(input.policySnapshot.overriddenPolicies),
    conflictPolicies: Object.freeze(input.policySnapshot.conflictPolicies),
    deterministicHash: hashRecommendationLineageValue("recommendation-lineage-policy-record", input.policySnapshot),
  });
}
