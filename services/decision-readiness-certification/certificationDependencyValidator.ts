import type { DecisionReadinessCertificationInput, DecisionReadinessCertificationError } from "./types/decisionReadinessCertificationTypes";

export function validateCertificationDependencies(
  input: DecisionReadinessCertificationInput,
): readonly DecisionReadinessCertificationError[] {
  const errors: DecisionReadinessCertificationError[] = [];
  if (!input.decisionAuditEpisodeResult.lineage.lineageHash || !input.constitutionalTransitionResult.lineage.lineageHash) {
    errors.push({
      code: "DECISION_READINESS_MISSING_LINEAGE",
      message: "Required immutable lineage is missing.",
      path: "lineage",
    });
  }
  if (input.proposalIntegrityResult.proposal.approvalDependencyIds.length === 0) {
    errors.push({
      code: "DECISION_READINESS_APPROVAL_INCONSISTENCY",
      message: "Approval dependency replay could not be verified.",
      path: "proposalIntegrityResult.proposal.approvalDependencyIds",
    });
  }
  if (!input.recommendationValidationResult.result.governanceSnapshotId) {
    errors.push({
      code: "DECISION_READINESS_GOVERNANCE_AMBIGUITY",
      message: "Governance lineage is ambiguous.",
      path: "recommendationValidationResult.result.governanceSnapshotId",
    });
  }
  return Object.freeze(errors);
}
