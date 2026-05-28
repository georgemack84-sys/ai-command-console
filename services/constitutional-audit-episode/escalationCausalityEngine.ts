import type {
  ConstitutionalAuditEpisodeInput,
  EscalationDecision,
} from "@/types/constitutional-audit-episode";
import { hashConstitutionalAuditValue } from "./constitutionalEpisodeHashEngine";

export function reconstructEscalationCausality(
  input: ConstitutionalAuditEpisodeInput,
): readonly EscalationDecision[] {
  const frozen = input.futureAutonomyResult.result.status === "blocked"
    || input.futureAutonomyResult.result.status === "frozen"
    || input.futureAutonomyResult.result.riskLevel === "critical";
  return Object.freeze([
    Object.freeze({
      decisionId: hashConstitutionalAuditValue("constitutional-audit-escalation-decision-id", input.episodeId),
      escalationLineageId: input.futureAutonomyResult.evidence.escalationLineageId,
      escalationState: frozen
        ? "frozen" as const
        : input.futureAutonomyResult.result.riskLevel === "high"
          ? "critical" as const
          : "elevated" as const,
      deterministicHash: hashConstitutionalAuditValue("constitutional-audit-escalation-decision", {
        episodeId: input.episodeId,
        escalationLineageId: input.futureAutonomyResult.evidence.escalationLineageId,
        frozen,
      }),
    }),
  ]);
}
