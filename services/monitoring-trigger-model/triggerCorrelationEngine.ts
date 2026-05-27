import type { MonitoringTrigger, TriggerCorrelation } from "@/types/monitoring-trigger-model";
import type { OverrideContractRecord } from "@/services/human-override-contract";
import { hashTriggerValue } from "./triggerHasher";

export function correlateTriggers(input: {
  triggers: readonly MonitoringTrigger[];
  overrideContract: OverrideContractRecord;
  createdAt: string;
}): readonly TriggerCorrelation[] {
  const severeTriggers = input.triggers.filter((trigger) => trigger.severity === "high" || trigger.severity === "critical");
  const hasOverrideConflict = input.overrideContract.conflicts.length > 0;
  if (severeTriggers.length < 2 && !hasOverrideConflict) {
    return Object.freeze([]);
  }

  const ids = severeTriggers.map((trigger) => trigger.triggerId);
  const evidenceHashes = severeTriggers.flatMap((trigger) => trigger.evidenceHashes);
  if (hasOverrideConflict) {
    evidenceHashes.push(...input.overrideContract.conflicts.map((conflict) =>
      hashTriggerValue("monitoring-trigger-override-conflict", conflict.type)));
  }

  return Object.freeze([
    Object.freeze({
      correlationId: hashTriggerValue("monitoring-trigger-correlation-id", {
        ids,
        overrideConflicts: input.overrideContract.conflicts,
        createdAt: input.createdAt,
      }),
      triggerIds: Object.freeze(ids),
      resultingSeverity: "critical",
      resultingCautionState: "frozen-recommended",
      reason: "Correlated uncertainty compounds constitutional caution.",
      evidenceHashes: Object.freeze(evidenceHashes.sort((left, right) => left.localeCompare(right))),
      createdAt: input.createdAt,
    }),
  ]);
}
