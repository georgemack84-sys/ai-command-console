import type { AutonomyReadinessProfile } from "@/types/autonomy-readiness";
import type { SafeActionGovernanceEvidence } from "@/types/safe-action-catalog";

export function bindSafeActionGovernance(readinessProfile: AutonomyReadinessProfile): SafeActionGovernanceEvidence {
  const disputed =
    readinessProfile.governanceBinding.disputed ||
    readinessProfile.derivedState === "disputed" ||
    readinessProfile.disputes.length > 0;

  return Object.freeze({
    ...readinessProfile.governanceBinding,
    required: true,
    valid: !disputed,
  });
}
