import type { ReadinessLineageEntry, ReadinessLineageLedger } from "@/types/constitutional-autonomy-readiness-gate";
import { hashReadinessValue } from "./readinessHasher";

export function appendReadinessLineage(input: {
  existing?: ReadinessLineageLedger;
  certificationId: string;
  readinessHash: string;
  replayHash: string;
  lineageHash: string;
  createdAt: string;
}): ReadinessLineageLedger {
  const entry: ReadinessLineageEntry = Object.freeze({
    entryId: hashReadinessValue("readiness-lineage-entry-id", {
      certificationId: input.certificationId,
      readinessHash: input.readinessHash,
      createdAt: input.createdAt,
    }),
    certificationId: input.certificationId,
    readinessHash: input.readinessHash,
    replayHash: input.replayHash,
    lineageHash: input.lineageHash,
    createdAt: input.createdAt,
  });

  const entries = Object.freeze([...(input.existing?.entries ?? []), entry]);
  return Object.freeze({
    ledgerId: hashReadinessValue("readiness-lineage-ledger-id", {
      previousLedgerId: input.existing?.ledgerId ?? "none",
      entries,
    }),
    entries,
    immutable: true,
  });
}
