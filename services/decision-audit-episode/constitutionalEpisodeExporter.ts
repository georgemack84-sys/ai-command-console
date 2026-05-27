import type { DecisionAuditEpisodeExport } from "./types/decisionAuditEpisodeTypes";
import { hashDecisionEpisodeValue } from "./decisionEpisodeHashEngine";

export function exportDecisionAuditEpisode(input: {
  episodeId: string;
  replayHash: string;
  auditHash: string;
  lineageHash: string;
}): DecisionAuditEpisodeExport {
  return Object.freeze({
    exportId: hashDecisionEpisodeValue("decision-audit-episode-export-id", {
      episodeId: input.episodeId,
    }),
    episodeId: input.episodeId,
    replayHash: input.replayHash,
    auditHash: input.auditHash,
    lineageHash: input.lineageHash,
    exportHash: hashDecisionEpisodeValue("decision-audit-episode-export", input),
  });
}
