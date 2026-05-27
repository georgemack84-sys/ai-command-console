import type {
  BoundedOrchestrationChronology,
  BoundedOrchestrationChronologyEntry,
} from "@/types/bounded-orchestration-framework";
import { hashOrchestrationValue } from "./orchestrationHashEngine";

export function appendOrchestrationChronology(input: {
  existing?: BoundedOrchestrationChronology;
  entry: BoundedOrchestrationChronologyEntry;
}): BoundedOrchestrationChronology {
  const entries = Object.freeze([
    ...(input.existing?.entries ?? []),
    input.entry,
  ]).slice().sort((left, right) => {
    if (left.createdAt !== right.createdAt) {
      return left.createdAt.localeCompare(right.createdAt);
    }
    return left.entryId.localeCompare(right.entryId);
  });
  return Object.freeze({
    chronologyId: input.existing?.chronologyId ?? hashOrchestrationValue("chronology-id", {
      orchestrationId: input.entry.orchestrationId,
      coordinationId: input.entry.coordinationId,
    }),
    entries: Object.freeze(entries),
    chronologyHash: hashOrchestrationValue("chronology-hash", entries),
  });
}
