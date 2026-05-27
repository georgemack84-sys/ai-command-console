import type { GovernanceDriftReplayLedgerEntry } from "@/types/governance-drift";
import { appendImmutableGovernanceDriftLedger } from "./immutableGovernanceDriftLedger";

export function appendGovernanceDriftAuditLedger(input: {
  existing?: readonly GovernanceDriftReplayLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly GovernanceDriftReplayLedgerEntry[] {
  return appendImmutableGovernanceDriftLedger(input);
}
