import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type {
  ReplayStabilityEvidence,
  ReplayStabilityLedgerEntry,
  ReplayStabilityLineageEntry,
  ReplayStabilityLineageLedger,
} from "./replayStateTypes";
import { hashReplayStabilityValue } from "./replayHashingEngine";

export function appendReplayStabilityLineage(input: {
  existing?: ReplayStabilityLineageLedger;
  entry: ReplayStabilityLineageEntry;
}): ReplayStabilityLineageLedger {
  const entries = Object.freeze([...(input.existing?.entries ?? []), Object.freeze(input.entry)]);
  return Object.freeze({
    entries,
    lineageHash: hashReplayStabilityValue("constitutional-replay-stability-lineage", entries),
  });
}

export function appendReplayStabilityLedger(input: {
  existing?: readonly ReplayStabilityLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly ReplayStabilityLedgerEntry[] {
  const previousHash = input.existing && input.existing.length > 0
    ? input.existing[input.existing.length - 1]?.entryHash ?? null
    : null;
  const entry = appendImmutableLedgerEntry({
    payload: input.payload,
    previousHash,
    scope: input.scope,
  });
  return Object.freeze([...(input.existing ?? []), Object.freeze(entry)]);
}

export function buildReplayStabilityEvidence(input: {
  replayId: string;
  authorityEvidenceId: string;
  evidenceRefs: readonly string[];
  reasons: readonly string[];
}): ReplayStabilityEvidence {
  const evidenceRefs = Object.freeze([...input.evidenceRefs].sort());
  const reasons = Object.freeze([...input.reasons].sort());
  return Object.freeze({
    evidenceId: hashReplayStabilityValue("constitutional-replay-stability-evidence-id", input.replayId),
    replayId: input.replayId,
    authorityEvidenceId: input.authorityEvidenceId,
    evidenceRefs,
    reasons,
    evidenceHash: hashReplayStabilityValue("constitutional-replay-stability-evidence", {
      replayId: input.replayId,
      evidenceRefs,
      reasons,
    }),
  });
}
