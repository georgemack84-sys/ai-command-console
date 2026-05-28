import type {
  ConstitutionalAuditEpisodeInput,
  ConstitutionalAuditEvidence,
} from "@/types/constitutional-audit-episode";
import { hashConstitutionalAuditValue } from "./constitutionalEpisodeHashEngine";

export function buildConstitutionalAuditEvidence(input: {
  episodeInput: ConstitutionalAuditEpisodeInput;
  evidenceRefs: readonly string[];
  reasons: readonly string[];
}): ConstitutionalAuditEvidence {
  const source = input.episodeInput.futureAutonomyResult;
  const base = Object.freeze({
    episodeId: input.episodeInput.episodeId,
    governanceLineageId: source.lineage.lineageId,
    replayLineageId: source.replayLineage.replayLineageId,
    escalationLineageId: source.evidence.escalationLineageId,
    approvalLineageId: source.evidence.approvalLineageId,
    evidenceRefs: Object.freeze([...input.evidenceRefs].sort()),
    reasons: Object.freeze([...input.reasons].sort()),
  });
  return Object.freeze({
    evidenceId: hashConstitutionalAuditValue("constitutional-audit-evidence-id", base),
    episodeId: input.episodeInput.episodeId,
    governanceLineageId: base.governanceLineageId,
    replayLineageId: base.replayLineageId,
    escalationLineageId: base.escalationLineageId,
    approvalLineageId: base.approvalLineageId,
    evidenceRefs: base.evidenceRefs,
    evidenceHash: hashConstitutionalAuditValue("constitutional-audit-evidence", base),
    immutable: true as const,
  });
}
