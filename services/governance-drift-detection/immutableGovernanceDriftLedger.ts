import type { GovernanceDriftReplayLedgerEntry } from "@/types/governance-drift";
import { appendImmutableGovernanceDriftLineageLedger } from "@/services/governance-drift-lineage/immutableGovernanceDriftLineageLedger";

export function appendImmutableGovernanceDriftLedger(input: {
  existing?: readonly GovernanceDriftReplayLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly GovernanceDriftReplayLedgerEntry[] {
  return appendImmutableGovernanceDriftLineageLedger(input);
}
