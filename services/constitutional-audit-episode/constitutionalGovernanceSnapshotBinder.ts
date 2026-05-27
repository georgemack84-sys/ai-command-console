import type {
  ConstitutionalAuditEpisodeInput,
  GovernanceValidationRecord,
} from "@/types/constitutional-audit-episode";
import { hashConstitutionalAuditValue } from "./constitutionalEpisodeHashEngine";

export function bindConstitutionalGovernanceSnapshot(
  input: ConstitutionalAuditEpisodeInput,
): readonly GovernanceValidationRecord[] {
  const governanceBound = input.futureAutonomyResult.result.governanceBound
    && !input.futureAutonomyResult.errors.some((item) =>
      item.code.includes("GOVERNANCE") || item.code.includes("CURRENT_STATE_SUBSTITUTION"),
    );
  return Object.freeze([
    Object.freeze({
      validationId: hashConstitutionalAuditValue("constitutional-audit-governance-validation-id", input.episodeId),
      governanceSnapshotId: input.futureAutonomyResult.record.governanceSnapshotId,
      governanceBound,
      rationale: governanceBound
        ? "Governance snapshot remains bound to original constitutional state."
        : "Governance binding is ambiguous or detached from original constitutional state.",
      deterministicHash: hashConstitutionalAuditValue("constitutional-audit-governance-validation", {
        episodeId: input.episodeId,
        governanceSnapshotId: input.futureAutonomyResult.record.governanceSnapshotId,
        governanceBound,
      }),
    }),
  ]);
}
