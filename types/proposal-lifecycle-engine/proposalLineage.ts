import type { ProposalState, ProposalTransition } from "./proposalState";

export type ProposalLineageEntry = Readonly<{
  entryId: string;
  transition: ProposalTransition;
  fromState: ProposalState;
  toState: ProposalState;
  timestamp: string;
  governanceHash: string;
  replayHash: string;
  snapshotLineageHash: string;
  safeActionHash: string;
  proposalHash: string;
}>;

export type ProposalLineageLedger = Readonly<{
  lineageId: string;
  entries: readonly ProposalLineageEntry[];
  archived: boolean;
}>;
