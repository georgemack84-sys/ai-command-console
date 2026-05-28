import type { ConstitutionalReplayLedgerEntry } from "@/types/constitutional-replay";
import { appendReplayAttackLedger } from "./immutableReplayAttackLedger";

export function appendReplayAttackAuditLedger(input: {
  existing?: readonly ConstitutionalReplayLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly ConstitutionalReplayLedgerEntry[] {
  return appendReplayAttackLedger(input);
}
