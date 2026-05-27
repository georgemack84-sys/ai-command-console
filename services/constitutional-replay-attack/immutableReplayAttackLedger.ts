import type { ConstitutionalReplayLedgerEntry } from "@/types/constitutional-replay";
import { appendImmutableReplayAttackLedger } from "@/services/constitutional-replay-lineage/immutableReplayLineageLedger";

export function appendReplayAttackLedger(input: {
  existing?: readonly ConstitutionalReplayLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly ConstitutionalReplayLedgerEntry[] {
  return appendImmutableReplayAttackLedger(input);
}
