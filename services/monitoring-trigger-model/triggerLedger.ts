import type { MonitoringTrigger, TriggerLineageEntry, TriggerLineageLedger } from "@/types/monitoring-trigger-model";
import { hashTriggerValue } from "./triggerHasher";

export function appendTriggerLedger(input: {
  existing?: TriggerLineageLedger;
  triggers: readonly MonitoringTrigger[];
  replayHash: string;
  lineageHash: string;
  createdAt: string;
}): TriggerLineageLedger {
  const existingEntries = input.existing?.entries ?? [];
  const newEntries: TriggerLineageEntry[] = input.triggers.map((trigger) =>
    Object.freeze({
      entryId: hashTriggerValue("monitoring-trigger-ledger-entry-id", {
        triggerId: trigger.triggerId,
        replayHash: input.replayHash,
        createdAt: input.createdAt,
      }),
      triggerId: trigger.triggerId,
      triggerHash: hashTriggerValue("monitoring-trigger-ledger-trigger-hash", trigger),
      replayHash: input.replayHash,
      lineageHash: input.lineageHash,
      createdAt: input.createdAt,
    }));

  return Object.freeze({
    lineageId: hashTriggerValue("monitoring-trigger-ledger-id", {
      previousLineageId: input.existing?.lineageId,
      lineageHash: input.lineageHash,
      entryCount: existingEntries.length + newEntries.length,
    }),
    entries: Object.freeze([...existingEntries, ...newEntries]),
    immutable: true,
  });
}
