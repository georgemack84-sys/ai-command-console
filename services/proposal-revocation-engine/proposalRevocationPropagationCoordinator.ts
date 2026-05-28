import { hashProposalRevocationValue } from "./proposalRevocationHasher";
import type { ProposalRevocationPropagationRecord, ProposalRevocationState } from "./proposalRevocationTypes";

const TARGETS: readonly ProposalRevocationPropagationRecord["target"][] = Object.freeze([
  "proposal-state-engine",
  "proposal-freeze-layer",
  "approval-systems",
  "dependency-registries",
  "replay-systems",
  "governance-registries",
  "immutable-audit-systems",
]);

export function propagateProposalRevocation(input: {
  proposalId: string;
  revocationState: ProposalRevocationState;
}): readonly ProposalRevocationPropagationRecord[] {
  return Object.freeze(TARGETS.map((target, index) => Object.freeze({
    propagationId: `proposal-revocation-propagation:${input.proposalId}:${index + 1}`,
    proposalId: input.proposalId,
    target,
    blocked: true as const,
    revocationState: input.revocationState,
    propagationHash: hashProposalRevocationValue("proposal-revocation-propagation", {
      proposalId: input.proposalId,
      target,
      revocationState: input.revocationState,
    }),
  })));
}
