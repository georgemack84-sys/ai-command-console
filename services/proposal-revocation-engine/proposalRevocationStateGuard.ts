import type { ProposalRevocationError, ProposalRevocationInput } from "./proposalRevocationTypes";

export function validateProposalRevocationState(input: ProposalRevocationInput): readonly ProposalRevocationError[] {
  const errors: ProposalRevocationError[] = [];
  const metadataHaystack = JSON.stringify({
    reason: input.proposalStateEngineInput.transition.reason,
    metadata: input.metadata ?? {},
  }).toLowerCase();

  if (metadataHaystack.includes("restore authority") || metadataHaystack.includes("restore approval")) {
    errors.push({
      code: "PROPOSAL_REVOCATION_AUTHORITY_RESTORATION",
      message: "Revocation input attempted to restore approval or authority during containment.",
      path: "metadata",
    });
  }

  if (metadataHaystack.includes("resurrect") || metadataHaystack.includes("unrevoke") || metadataHaystack.includes("revive")) {
    errors.push({
      code: "PROPOSAL_REVOCATION_RESURRECTION_ATTEMPT",
      message: "Revocation input attempted proposal resurrection or silent unrevoke behavior.",
      path: "metadata",
    });
  }

  return Object.freeze(errors);
}
