import type { ConstitutionalAuditLedgerEntry } from "@/types/constitutional-audit-episode";
import { appendImmutableConstitutionalEpisodeLedger } from "./immutableConstitutionalEpisodeLedger";

export function appendConstitutionalAuditLedger(input: {
  existing?: readonly ConstitutionalAuditLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly ConstitutionalAuditLedgerEntry[] {
  return appendImmutableConstitutionalEpisodeLedger(input);
}
