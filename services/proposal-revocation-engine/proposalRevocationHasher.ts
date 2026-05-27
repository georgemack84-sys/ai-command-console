import { hashReplayValue } from "@/services/recommendation-replay/replayHashEngine";

export function hashProposalRevocationValue(scope: string, value: unknown): string {
  return hashReplayValue(scope, value);
}
