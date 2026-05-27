import type { DecisionAuditEpisodeInput, EpisodeSnapshotRecord } from "./types/decisionAuditEpisodeTypes";
import { hashDecisionEpisodeValue } from "./decisionEpisodeHashEngine";

export function recordProposalLineage(input: DecisionAuditEpisodeInput): EpisodeSnapshotRecord {
  return Object.freeze({
    snapshotId: input.proposalIntegrityResult.snapshot.snapshotId,
    snapshotType: "proposal",
    snapshotHash: hashDecisionEpisodeValue("decision-episode-proposal", {
      proposalId: input.proposalIntegrityResult.proposal.proposalId,
      proposalHash: input.proposalIntegrityResult.proposal.proposalHash,
      replayHash: input.proposalIntegrityResult.proposal.replayHash,
    }),
    lineageHash: input.proposalIntegrityResult.lineage.lineageHash,
    immutable: true as const,
  });
}
