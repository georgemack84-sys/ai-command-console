import { hashConstitutionalTransitionValue } from "./transitionHashEngine";
import type {
  ConstitutionalTransitionGovernanceCorrelation,
  ConstitutionalTransitionInput,
} from "./types/constitutionalTransitionTypes";

export function correlateGovernanceTransition(
  input: ConstitutionalTransitionInput,
): ConstitutionalTransitionGovernanceCorrelation {
  const governanceHash = hashConstitutionalTransitionValue("constitutional-transition-governance-hash", {
    governanceBasisId: input.governanceBasisId,
    governanceSnapshotId: input.recommendationValidationResult.result.governanceSnapshotId,
    policySnapshotId: input.policySnapshotId,
    recommendationGovernanceHash: input.decisionAuditEpisodeResult.episode.governanceHash,
  });
  return Object.freeze({
    governanceBasisId: input.governanceBasisId,
    policySnapshotId: input.policySnapshotId,
    governanceValidated: input.recommendationValidationResult.result.governanceValidated,
    governanceHash,
    correlationHash: hashConstitutionalTransitionValue("constitutional-transition-governance-correlation", {
      governanceBasisId: input.governanceBasisId,
      policySnapshotId: input.policySnapshotId,
      governanceValidated: input.recommendationValidationResult.result.governanceValidated,
      governanceHash,
    }),
  });
}
