import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type {
  OperatorAuthorityLedgerEntry,
  OperatorAuthorityLineageEntry,
  OperatorAuthorityLineageLedger,
} from "./types/operatorAuthorityTypes";
import { hashOverrideReplayValue } from "./overrideReplayHashEngine";

export function appendOperatorAuthorityLineage(input: {
  existing?: OperatorAuthorityLineageLedger;
  entry: OperatorAuthorityLineageEntry;
}): OperatorAuthorityLineageLedger {
  const entries = Object.freeze([...(input.existing?.entries ?? []), input.entry]);
  return Object.freeze({
    entries,
    lineageHash: hashOverrideReplayValue("operator-authority-lineage", entries),
  });
}

export function appendOperatorAuthorityLedger(input: {
  existing?: readonly OperatorAuthorityLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly OperatorAuthorityLedgerEntry[] {
  const previousHash = input.existing?.at(-1)?.entryHash ?? null;
  const entry = appendImmutableLedgerEntry({
    payload: input.payload,
    previousHash,
    scope: input.scope,
  });
  return Object.freeze([...(input.existing ?? []), entry]);
}
