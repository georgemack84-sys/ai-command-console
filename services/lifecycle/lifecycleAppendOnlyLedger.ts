import type { BoundedIntentLifecycleState, LifecycleLineageEntry, LifecycleLineageLedger } from "@/types/lifecycle";
import { buildLifecycleHash } from "./lifecycleHasher";

export function appendLifecycleLedger(input: {
  existing?: LifecycleLineageLedger;
  transitionId: string;
  fromState: string;
  toState: BoundedIntentLifecycleState;
  proposalId: string;
  replayHash: string;
  createdAt: string;
}): LifecycleLineageLedger {
  const entry: LifecycleLineageEntry = Object.freeze({
    entryId: buildLifecycleHash("lifecycle-lineage-entry-id", {
      transitionId: input.transitionId,
      createdAt: input.createdAt,
    }),
    transitionId: input.transitionId,
    proposalId: input.proposalId,
    fromState: input.fromState,
    toState: input.toState,
    replayHash: input.replayHash,
    createdAt: input.createdAt,
  });
  const entries = Object.freeze([...(input.existing?.entries ?? []), entry]);

  return Object.freeze({
    ledgerId: input.existing?.ledgerId ?? buildLifecycleHash("lifecycle-ledger-id", {
      proposalId: input.proposalId,
      createdAt: input.createdAt,
    }),
    entries,
    lineageHash: buildLifecycleHash("lifecycle-ledger-hash", entries),
  });
}
