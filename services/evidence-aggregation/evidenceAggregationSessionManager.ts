import { EVIDENCE_ORDERING_VERSION } from "./evidenceAggregationContracts";
import { hashEvidenceValue } from "./evidenceHashEngine";
import type { EvidenceAggregationSession } from "./types/evidenceAggregationTypes";

export function buildEvidenceAggregationSession(input: {
  aggregationSessionId: string;
  startedAt: string;
  completedAt?: string;
  status: EvidenceAggregationSession["aggregationStatus"];
  evidenceReferences: readonly string[];
  governanceSnapshotId: string;
  replaySessionId?: string;
  integrityStatus: EvidenceAggregationSession["integrityStatus"];
  canonicalAggregationHash: string;
}): EvidenceAggregationSession {
  return Object.freeze({
    aggregationSessionId: input.aggregationSessionId,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    aggregationStatus: input.status,
    evidenceReferences: [...input.evidenceReferences],
    canonicalAggregationHash: input.canonicalAggregationHash,
    governanceSnapshotId: input.governanceSnapshotId,
    replaySessionId: input.replaySessionId,
    integrityStatus: input.integrityStatus,
    deterministicOrderingVersion: EVIDENCE_ORDERING_VERSION,
  });
}

export function hashEvidenceAggregationSession(session: EvidenceAggregationSession): string {
  return hashEvidenceValue("evidence-aggregation-session", session);
}
