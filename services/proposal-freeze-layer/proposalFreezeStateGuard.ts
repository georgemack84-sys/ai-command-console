import type { ProposalFreezeError, ProposalFreezeInput } from "./types/proposalFreezeTypes";

export function validateProposalFreezeState(
  input: ProposalFreezeInput,
): readonly ProposalFreezeError[] {
  const errors: ProposalFreezeError[] = [];
  const existingFreeze = input.existingFreezeRecord;

  if (!existingFreeze) {
    return Object.freeze(errors);
  }

  if (
    existingFreeze.freezeState !== "ACTIVE"
    && input.proposalStateEngineResult.transitionResult.accepted
  ) {
    errors.push({
      code: "PROPOSAL_FREEZE_STATE_BYPASS",
      message: "Frozen proposals may not progress lifecycle state while freeze containment is active.",
      path: "proposalStateEngineResult.transitionResult.accepted",
    });
  }

  const metadataHaystack = JSON.stringify(input.metadata ?? {}).toLowerCase();
  if (metadataHaystack.includes("unfreeze") || metadataHaystack.includes("resurrect")) {
    errors.push({
      code: "PROPOSAL_FREEZE_UNFREEZE_ATTEMPT",
      message: "Proposal freeze layer detected a silent unfreeze or resurrection attempt.",
      path: "metadata",
    });
  }

  return Object.freeze(errors);
}
