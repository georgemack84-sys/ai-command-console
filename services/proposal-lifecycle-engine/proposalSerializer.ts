import { normalizeProposalValue } from "./proposalNormalizer";

export function serializeProposalValue(value: unknown): string {
  return JSON.stringify(normalizeProposalValue(value));
}
