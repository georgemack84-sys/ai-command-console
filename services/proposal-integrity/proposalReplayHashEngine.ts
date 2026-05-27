import { hashProposalIntegrityValue } from "./proposalHashEngine";

export function hashProposalReplayValue(scope: string, value: unknown): string {
  return hashProposalIntegrityValue(`proposal-replay:${scope}`, value);
}
