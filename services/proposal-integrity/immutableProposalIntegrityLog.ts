import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type {
  ProposalIntegrityLedgerEntry,
  ProposalIntegrityLineageEntry,
  ProposalIntegrityLineageLedger,
} from "./proposalIntegrityStateTypes";
import { hashProposalIntegrityValue } from "./proposalHashEngine";

export function appendProposalIntegrityLineage(input: {
  existing?: ProposalIntegrityLineageLedger;
  entry: ProposalIntegrityLineageEntry;
}): ProposalIntegrityLineageLedger {
  const entries = Object.freeze([...(input.existing?.entries ?? []), input.entry]);
  return Object.freeze({
    entries,
    lineageHash: hashProposalIntegrityValue("proposal-lineage-ledger", entries),
  });
}

export function appendProposalIntegrityLedger(input: {
  existing?: readonly ProposalIntegrityLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly ProposalIntegrityLedgerEntry[] {
  const previousHash = input.existing?.at(-1)?.entryHash ?? null;
  const entry = appendImmutableLedgerEntry({
    payload: input.payload,
    previousHash,
    scope: input.scope,
  });
  return Object.freeze([...(input.existing ?? []), entry]);
}
