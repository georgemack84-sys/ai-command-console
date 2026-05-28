import type {
  ConstitutionalAuditEpisodeInput,
  OutcomeRecord,
} from "@/types/constitutional-audit-episode";
import { hashConstitutionalAuditValue } from "./constitutionalEpisodeHashEngine";

export function reconstructConstitutionalOutcome(
  input: ConstitutionalAuditEpisodeInput,
): readonly OutcomeRecord[] {
  const status = input.futureAutonomyResult.result.status;
  const outcomeState = status === "blocked" || status === "frozen" || status === "disputed"
    ? status
    : "verified";
  return Object.freeze([
    Object.freeze({
      outcomeId: hashConstitutionalAuditValue("constitutional-audit-outcome-id", input.episodeId),
      outcomeState,
      deterministicHash: hashConstitutionalAuditValue("constitutional-audit-outcome", {
        episodeId: input.episodeId,
        outcomeState,
      }),
    }),
  ]);
}
