import type { AuditInterpretation, AuditObservation } from "@/types/autonomy-audit-episode-model";
import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import { hashAuditEpisodeValue } from "./auditEpisodeHasher";

export function reconstructInterpretation(input: {
  observation: AuditObservation;
  governanceView: ConstitutionalGovernanceView;
  createdAt: string;
}): AuditInterpretation {
  const summary =
    input.observation.cautionState === "frozen-recommended"
      ? "Correlated constitutional evidence supports preserving a freeze recommendation."
      : input.observation.cautionState === "escalated"
        ? "Constitutional evidence supports increased human review."
        : input.observation.cautionState === "restricted"
          ? "Constitutional evidence supports restricted autonomy progression."
          : "Constitutional evidence supports continued observation only.";

  return Object.freeze({
    interpretationId: hashAuditEpisodeValue("autonomy-audit-interpretation-id", {
      observationId: input.observation.observationId,
      governanceHash: input.governanceView.constitutionalDecisionHash,
      createdAt: input.createdAt,
    }),
    summary,
    derivedFromObservationId: input.observation.observationId,
    governanceHash: input.governanceView.constitutionalDecisionHash,
    confidenceScore: input.observation.confidenceScore,
    createdAt: input.createdAt,
  });
}
