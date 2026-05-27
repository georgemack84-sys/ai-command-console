import type {
  ConstitutionalAuditEpisodeInput,
  OperatorIntervention,
} from "@/types/constitutional-audit-episode";
import { hashConstitutionalAuditValue } from "./constitutionalEpisodeHashEngine";

export function trackOperatorInterventions(
  input: ConstitutionalAuditEpisodeInput,
): readonly OperatorIntervention[] {
  const disputed = input.futureAutonomyResult.record.failClosed
    || input.futureAutonomyResult.result.status === "disputed";
  return Object.freeze([
    Object.freeze({
      interventionId: hashConstitutionalAuditValue("constitutional-audit-operator-intervention-id", input.episodeId),
      interventionType: disputed
        ? "review-required" as const
        : input.futureAutonomyResult.result.status === "frozen"
          ? "freeze-visible" as const
          : "override-visible" as const,
      deterministicHash: hashConstitutionalAuditValue("constitutional-audit-operator-intervention", {
        episodeId: input.episodeId,
        disputed,
        status: input.futureAutonomyResult.result.status,
      }),
    }),
  ]);
}
