import type { AttackReplayLedgerEntry } from "@/types/constitutional-attack-engine";
import { appendImmutableAttackLineageLedger } from "./immutableAttackLineageLedger";

export function appendAttackReplayLedger(input: {
  existing?: readonly AttackReplayLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly AttackReplayLedgerEntry[] {
  return appendImmutableAttackLineageLedger(input);
}
