import type { ProposalReplayBinding, ProposalRevocation } from "@/types/proposal-lifecycle-engine";

export function evaluateProposalRevocation(input: {
  revocation?: ProposalRevocation;
  replayBinding: ProposalReplayBinding;
}): ProposalRevocation {
  if (input.revocation) {
    return Object.freeze({
      ...input.revocation,
      replayLineageHash: input.replayBinding.replayLineageHash,
      immutable: true,
    });
  }

  return Object.freeze({
    revocationId: "proposal-revocation:active",
    status: "active",
    revokedBy: Object.freeze([]),
    replayLineageHash: input.replayBinding.replayLineageHash,
    immutable: true,
  });
}
