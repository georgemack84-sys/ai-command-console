import type {
  GovernanceLineageRecord,
  RecommendationLineageInput,
} from "./recommendationLineageStateTypes";
import { hashRecommendationLineageValue } from "./lineageGraphHasher";

export function resolveGovernanceSnapshot(input: RecommendationLineageInput): GovernanceLineageRecord {
  return Object.freeze({
    governanceSnapshotId: input.constitutionalReadinessResult.record.governanceSnapshotId,
    governanceBound: input.constitutionalCertificationResult.record.governanceBound
      && input.constitutionalReadinessResult.record.governanceBound
      && input.humanSupremacyResult.record.governanceBound,
    constitutionalBindings: Object.freeze([
      input.constitutionalReadinessResult.governanceBinding.bindingId,
      input.constitutionalCertificationResult.governanceImmutability.governanceSnapshotId,
    ]),
    validatorVersions: Object.freeze([
      input.validatorVersionId,
      input.constitutionalReadinessResult.record.readinessId,
      input.constitutionalCertificationResult.record.certificationId,
    ]),
    governanceEscalationState: input.escalationDeterminismResult.record.oversightState,
    policyEnforcementState: input.constitutionalCertificationResult.policy.containmentDominatesAutonomy
      ? "containment_dominant"
      : "containment_disputed",
    deterministicHash: hashRecommendationLineageValue("recommendation-lineage-governance-record", {
      governanceSnapshotId: input.constitutionalReadinessResult.record.governanceSnapshotId,
      governanceBound: input.constitutionalCertificationResult.record.governanceBound,
      oversightState: input.escalationDeterminismResult.record.oversightState,
    }),
  });
}
