import { hashProposalIntegrityValue } from "./proposalHashEngine";

export function hashProposalGovernanceValue(value: unknown): string {
  return hashProposalIntegrityValue("proposal-governance", value);
}
