import { hashProposalReplayValue } from "@/services/proposal-replay/replayHasher";

export function hashConfidenceValue(scope: string, value: unknown): string {
  return hashProposalReplayValue(scope, value);
}
