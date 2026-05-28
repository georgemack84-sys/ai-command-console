import { canonicalizeProposalFreezeToString } from "./proposalFreezeCanonicalizer";
import type {
  ProposalFreezeEvent,
  ProposalFreezeLineageLog,
  ProposalFreezeRecord,
} from "./types/proposalFreezeTypes";

export function serializeProposalFreezeRecord(value: ProposalFreezeRecord): string {
  return canonicalizeProposalFreezeToString(value);
}

export function serializeProposalFreezeEvent(value: ProposalFreezeEvent): string {
  return canonicalizeProposalFreezeToString(value);
}

export function serializeProposalFreezeLineage(value: ProposalFreezeLineageLog): string {
  return canonicalizeProposalFreezeToString(value);
}
