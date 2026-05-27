import type { ApprovalDependencyLedger } from "@/types/approval-dependency-graph";
import { hashApprovalGraphValue } from "./approvalGraphHasher";

export function appendApprovalDependencyLedger(input: {
  existing?: ApprovalDependencyLedger;
  proposalId: string;
  graphHash: string;
  replayHash: string;
  lineageHash: string;
  timestamp: string;
}): ApprovalDependencyLedger {
  const entry = Object.freeze({
    entryId: hashApprovalGraphValue("approval-ledger-entry-id", input),
    proposalId: input.proposalId,
    graphHash: input.graphHash,
    replayHash: input.replayHash,
    lineageHash: input.lineageHash,
    timestamp: input.timestamp,
  });

  return Object.freeze({
    ledgerId: input.existing?.ledgerId ?? hashApprovalGraphValue("approval-ledger-id", {
      proposalId: input.proposalId,
      firstTimestamp: input.timestamp,
    }),
    entries: Object.freeze([...(input.existing?.entries ?? []), entry]),
    immutable: true,
  });
}
