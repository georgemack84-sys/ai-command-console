import type { FutureAutonomyReplayLedgerEntry } from "@/types/future-autonomy";
import { appendImmutableFutureAutonomyLedger } from "./immutableFutureAutonomyLedger";

export function appendFutureAutonomyAuditLedger(input: {
  existing?: readonly FutureAutonomyReplayLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly FutureAutonomyReplayLedgerEntry[] {
  return appendImmutableFutureAutonomyLedger(input);
}
