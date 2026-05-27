import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type {
  AuthorityBoundaryEvidence,
  AuthorityBoundaryLedgerEntry,
  AuthorityBoundaryLineageEntry,
  AuthorityBoundaryLineageLedger,
} from "./authorityBoundaryTypes";
import { hashAuthorityValue } from "./authorityHashingEngine";

export function appendAuthorityBoundaryLineage(input: {
  existing?: AuthorityBoundaryLineageLedger;
  entry: AuthorityBoundaryLineageEntry;
}): AuthorityBoundaryLineageLedger {
  const entries = Object.freeze([...(input.existing?.entries ?? []), Object.freeze(input.entry)]);
  return Object.freeze({
    entries,
    lineageHash: hashAuthorityValue("constitutional-authority-lineage", entries),
  });
}

export function appendAuthorityBoundaryLedger(input: {
  existing?: readonly AuthorityBoundaryLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly AuthorityBoundaryLedgerEntry[] {
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

export function buildAuthorityEvidence(input: {
  boundaryId: string;
  gateEvidenceId: string;
  evidenceRefs: readonly string[];
  reasons: readonly string[];
}): AuthorityBoundaryEvidence {
  const evidenceRefs = Object.freeze([...input.evidenceRefs].sort());
  const reasons = Object.freeze([...input.reasons].sort());
  return Object.freeze({
    evidenceId: hashAuthorityValue("constitutional-authority-evidence-id", input.boundaryId),
    boundaryId: input.boundaryId,
    gateEvidenceId: input.gateEvidenceId,
    evidenceRefs,
    reasons,
    evidenceHash: hashAuthorityValue("constitutional-authority-evidence", {
      boundaryId: input.boundaryId,
      evidenceRefs,
      reasons,
    }),
  });
}
