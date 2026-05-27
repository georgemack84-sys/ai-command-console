import { hashProposalFreezeValue } from "./proposalFreezeHasher";
import type {
  ProposalFreezePropagationRecord,
  ProposalFreezeRecord,
} from "./types/proposalFreezeTypes";

const TARGETS: readonly ProposalFreezePropagationRecord["target"][] = Object.freeze([
  "proposal-state-engine",
  "replay-validators",
  "governance-registries",
  "approval-systems",
  "dependency-registries",
  "immutable-audit-systems",
  "operator-visibility-systems",
]);

export function propagateProposalFreeze(input: {
  proposalId: string;
  freezeRecord: ProposalFreezeRecord;
}): readonly ProposalFreezePropagationRecord[] {
  return Object.freeze(TARGETS.map((target) => Object.freeze({
    propagationId: `${input.freezeRecord.freezeId}:${target}`,
    proposalId: input.proposalId,
    target,
    blocked: true as const,
    freezeState: input.freezeRecord.freezeState,
    propagationHash: hashProposalFreezeValue("proposal-freeze-propagation", {
      freezeId: input.freezeRecord.freezeId,
      target,
      freezeState: input.freezeRecord.freezeState,
    }),
  })));
}
