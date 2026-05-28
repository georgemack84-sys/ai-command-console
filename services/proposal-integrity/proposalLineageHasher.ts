import { hashProposalIntegrityValue } from "./proposalHashEngine";

export function hashProposalLineageValue(value: unknown): string {
  return hashProposalIntegrityValue("proposal-lineage", value);
}
