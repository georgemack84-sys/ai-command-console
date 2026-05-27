import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type {
  CertificationLedgerEntry,
  CertificationLineageEntry,
  CertificationLineageLedger,
} from "./certificationStateTypes";
import { hashCertificationValue } from "./certificationTraceHasher";

export function appendCertificationLineage(input: {
  existing?: CertificationLineageLedger;
  entry: CertificationLineageEntry;
}): CertificationLineageLedger {
  const entries = Object.freeze([...(input.existing?.entries ?? []), input.entry]);
  return Object.freeze({
    entries,
    lineageHash: hashCertificationValue("constitutional-certification-lineage", entries),
  });
}

export function appendCertificationLedger(input: {
  existing?: readonly CertificationLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly CertificationLedgerEntry[] {
  const previousHash = input.existing?.at(-1)?.entryHash ?? null;
  const entry = appendImmutableLedgerEntry({
    payload: input.payload,
    previousHash,
    scope: input.scope,
  });
  return Object.freeze([...(input.existing ?? []), entry]);
}
