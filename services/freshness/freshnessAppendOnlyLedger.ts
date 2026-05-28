import type { ProposalFreshnessState } from "@/types/freshness";
import { hashFreshnessValue } from "./freshnessHasher";

export type FreshnessLineageEntry = Readonly<{
  entryId: string;
  proposalId: string;
  freshnessStatus: ProposalFreshnessState["freshnessStatus"];
  replayIntegrity: ProposalFreshnessState["replayIntegrity"];
  governanceCompatibility: ProposalFreshnessState["governanceCompatibility"];
  createdAt: string;
  stateHash: string;
}>;

export type FreshnessLineageLedger = Readonly<{
  ledgerId: string;
  entries: readonly FreshnessLineageEntry[];
  lineageHash: string;
}>;

export function appendFreshnessLedger(input: {
  existing?: FreshnessLineageLedger;
  state: ProposalFreshnessState;
  stateHash: string;
  createdAt: string;
}): FreshnessLineageLedger {
  const entry: FreshnessLineageEntry = Object.freeze({
    entryId: hashFreshnessValue("freshness-lineage-entry-id", {
      proposalId: input.state.proposalId,
      createdAt: input.createdAt,
      stateHash: input.stateHash,
    }),
    proposalId: input.state.proposalId,
    freshnessStatus: input.state.freshnessStatus,
    replayIntegrity: input.state.replayIntegrity,
    governanceCompatibility: input.state.governanceCompatibility,
    createdAt: input.createdAt,
    stateHash: input.stateHash,
  });

  const entries = Object.freeze([...(input.existing?.entries ?? []), entry]);
  return Object.freeze({
    ledgerId: input.existing?.ledgerId ?? hashFreshnessValue("freshness-lineage-ledger-id", {
      proposalId: input.state.proposalId,
      createdAt: input.createdAt,
    }),
    entries,
    lineageHash: hashFreshnessValue("freshness-lineage-ledger", entries),
  });
}
