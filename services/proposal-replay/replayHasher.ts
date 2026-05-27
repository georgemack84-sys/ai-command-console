import { hashReplayValue } from "@/services/recommendation-replay/replayHashEngine";

export function hashProposalReplayValue(scope: string, value: unknown): string {
  return hashReplayValue(scope, value);
}
