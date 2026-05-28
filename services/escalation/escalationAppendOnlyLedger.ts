import type { EscalationLineageEntry, EscalationLineageLedger } from "@/types/escalation";
import { hashEscalationCoordinationValue } from "./escalationHasher";

export function appendEscalationLedger(input: {
  existing?: EscalationLineageLedger;
  entry: EscalationLineageEntry;
}): EscalationLineageLedger {
  const entries = Object.freeze([...(input.existing?.entries ?? []), input.entry]);
  return Object.freeze({
    ledgerId: input.existing?.ledgerId ?? hashEscalationCoordinationValue("escalation-ledger-id", input.entry),
    entries,
    lineageHash: hashEscalationCoordinationValue("escalation-ledger", entries),
  });
}
