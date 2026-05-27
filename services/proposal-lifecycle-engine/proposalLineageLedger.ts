import type { ProposalLineageEntry, ProposalLineageLedger, ProposalState, ProposalTransition } from "@/types/proposal-lifecycle-engine";
import { hashProposalLifecycleValue } from "./proposalLifecycleHasher";

export function appendProposalLineage(input: {
  existing?: ProposalLineageLedger;
  transition: ProposalTransition;
  fromState: ProposalState;
  toState: ProposalState;
  timestamp: string;
  governanceHash: string;
  replayHash: string;
  snapshotLineageHash: string;
  safeActionHash: string;
}): ProposalLineageLedger {
  const entryId = hashProposalLifecycleValue("proposal-lineage-entry-id", input);
  const proposalHash = hashProposalLifecycleValue("proposal-lineage-entry", input);
  const entry: ProposalLineageEntry = Object.freeze({
    entryId,
    transition: input.transition,
    fromState: input.fromState,
    toState: input.toState,
    timestamp: input.timestamp,
    governanceHash: input.governanceHash,
    replayHash: input.replayHash,
    snapshotLineageHash: input.snapshotLineageHash,
    safeActionHash: input.safeActionHash,
    proposalHash,
  });

  return Object.freeze({
    lineageId: input.existing?.lineageId ?? hashProposalLifecycleValue("proposal-lineage-id", {
      governanceHash: input.governanceHash,
      replayHash: input.replayHash,
      snapshotLineageHash: input.snapshotLineageHash,
      safeActionHash: input.safeActionHash,
    }),
    entries: Object.freeze([...(input.existing?.entries ?? []), entry]),
    archived: input.toState === "archived",
  });
}
