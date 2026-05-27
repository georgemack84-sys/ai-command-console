import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type {
  DecisionReadinessCertificationLedgerEntry,
  DecisionReadinessCertificationLineageEntry,
  DecisionReadinessCertificationLineageLedger,
} from "./types/decisionReadinessCertificationTypes";
import { hashCertificationValue } from "./certificationHashEngine";

export function appendCertificationLineage(input: {
  existing?: DecisionReadinessCertificationLineageLedger;
  entry: DecisionReadinessCertificationLineageEntry;
}): DecisionReadinessCertificationLineageLedger {
  const entries = Object.freeze([...(input.existing?.entries ?? []), input.entry]);
  return Object.freeze({
    entries,
    lineageHash: hashCertificationValue("decision-readiness-lineage", entries),
  });
}

export function appendCertificationAuditEntry(input: {
  existing?: readonly DecisionReadinessCertificationLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly DecisionReadinessCertificationLedgerEntry[] {
  const previousHash = input.existing?.at(-1)?.entryHash ?? null;
  const entry = appendImmutableLedgerEntry({
    payload: input.payload,
    previousHash,
    scope: input.scope,
  });
  return Object.freeze([...(input.existing ?? []), entry]);
}
