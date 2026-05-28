import { hashReplayValue } from "@/services/recommendation-replay/replayHashEngine";

export function hashProposalFreezeValue(scope: string, value: unknown): string {
  return hashReplayValue(scope, value);
}
