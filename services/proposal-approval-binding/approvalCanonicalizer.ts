import {
  canonicalizeProposalReplayToString,
  canonicalizeProposalReplayValue,
} from "@/services/proposal-replay/replayCanonicalizer";

export function canonicalizeApprovalValue<T>(value: T): T {
  return canonicalizeProposalReplayValue(value);
}

export function canonicalizeApprovalToString(value: unknown): string {
  return canonicalizeProposalReplayToString(value);
}
