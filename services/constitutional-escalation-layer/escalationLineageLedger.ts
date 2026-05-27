import type { ConstitutionalEscalationLineageEntry, ConstitutionalEscalationLineageLedger } from "@/types/constitutional-escalation-layer";
import { hashEscalationValue } from "./escalationHasher";

export function appendEscalationLineage(input: {
  existing?: ConstitutionalEscalationLineageLedger;
  escalationId: string;
  escalationHash: string;
  replayHash: string;
  lineageHash: string;
  createdAt: string;
}): ConstitutionalEscalationLineageLedger {
  const entry: ConstitutionalEscalationLineageEntry = Object.freeze({
    entryId: hashEscalationValue("constitutional-escalation-lineage-entry-id", {
      escalationId: input.escalationId,
      escalationHash: input.escalationHash,
      createdAt: input.createdAt,
    }),
    escalationId: input.escalationId,
    escalationHash: input.escalationHash,
    replayHash: input.replayHash,
    lineageHash: input.lineageHash,
    createdAt: input.createdAt,
  });

  const entries = Object.freeze([...(input.existing?.entries ?? []), entry]);
  return Object.freeze({
    ledgerId: hashEscalationValue("constitutional-escalation-ledger-id", {
      previousLedgerId: input.existing?.ledgerId ?? "none",
      entries,
    }),
    entries,
    immutable: true,
  });
}
