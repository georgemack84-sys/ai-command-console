import { hashProposalReplayValue } from "@/services/proposal-replay/replayHasher";

export function hashApprovalValue(scope: string, value: unknown): string {
  return hashProposalReplayValue(scope, value);
}
