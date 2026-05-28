import { hashConstitutionalTransitionValue } from "./transitionHashEngine";
import type {
  ConstitutionalTransitionInput,
  ConstitutionalTransitionLineageEntry,
  ConstitutionalTransitionLineageLedger,
} from "./types/constitutionalTransitionTypes";

export function buildTransitionLineageEntry(
  input: ConstitutionalTransitionInput,
): ConstitutionalTransitionLineageEntry {
  return Object.freeze({
    entryId: hashConstitutionalTransitionValue("constitutional-transition-lineage-entry-id", {
      transitionId: input.transitionId,
      createdAt: input.createdAt,
    }),
    transitionId: input.transitionId,
    entityId: input.entityId,
    entityType: input.entityType,
    sourceState: input.sourceState,
    targetState: input.targetState,
    createdAt: input.createdAt,
    deterministicHash: hashConstitutionalTransitionValue("constitutional-transition-lineage-entry", {
      transitionId: input.transitionId,
      entityId: input.entityId,
      entityType: input.entityType,
      sourceState: input.sourceState,
      targetState: input.targetState,
      replayHash: input.deterministicReplayResult.result.replayHash,
    }),
  });
}

export function appendTransitionLineage(input: {
  existing?: ConstitutionalTransitionLineageLedger;
  entry: ConstitutionalTransitionLineageEntry;
}): ConstitutionalTransitionLineageLedger {
  const entries = Object.freeze([...(input.existing?.entries ?? []), input.entry]);
  return Object.freeze({
    entries,
    lineageHash: hashConstitutionalTransitionValue("constitutional-transition-lineage", entries),
  });
}
