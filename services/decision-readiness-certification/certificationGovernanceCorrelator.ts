import { hashCertificationValue } from "./certificationHashEngine";
import type {
  DecisionReadinessCertificationInput,
  DecisionReadinessGovernanceRecord,
} from "./types/decisionReadinessCertificationTypes";

export function correlateCertificationGovernance(
  input: DecisionReadinessCertificationInput,
): DecisionReadinessGovernanceRecord {
  const governanceLineageVerified =
    input.recommendationValidationResult.result.governanceValidated
    && input.constitutionalTransitionResult.governanceCorrelation.governanceValidated
    && input.decisionAuditEpisodeResult.episode.governanceHash === input.constitutionalTransitionResult.transition.governanceHash;
  return Object.freeze({
    governanceSnapshotId: input.recommendationValidationResult.result.governanceSnapshotId,
    governanceHash: input.constitutionalTransitionResult.transition.governanceHash,
    governanceLineageVerified,
    governanceRecordHash: hashCertificationValue("decision-readiness-governance-record", {
      governanceSnapshotId: input.recommendationValidationResult.result.governanceSnapshotId,
      governanceHash: input.constitutionalTransitionResult.transition.governanceHash,
      governanceLineageVerified,
    }),
  });
}
