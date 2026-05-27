import type {
  ApprovalDependency,
  ConstitutionalAuditEpisodeInput,
} from "@/types/constitutional-audit-episode";
import { hashConstitutionalAuditValue } from "./constitutionalEpisodeHashEngine";

export function reconstructApprovalDependencies(
  input: ConstitutionalAuditEpisodeInput,
): readonly ApprovalDependency[] {
  const ambiguous = input.futureAutonomyResult.errors.some((item) =>
    item.code.includes("APPROVAL") || item.code.includes("SYNTHETIC") || item.code.includes("LINEAGE"),
  );
  return Object.freeze([
    Object.freeze({
      dependencyId: hashConstitutionalAuditValue("constitutional-audit-approval-dependency-id", input.episodeId),
      lineageId: input.futureAutonomyResult.evidence.approvalLineageId,
      dependencyState: ambiguous ? "ambiguous" as const : "stable" as const,
      deterministicHash: hashConstitutionalAuditValue("constitutional-audit-approval-dependency", {
        episodeId: input.episodeId,
        lineageId: input.futureAutonomyResult.evidence.approvalLineageId,
        ambiguous,
      }),
    }),
  ]);
}
