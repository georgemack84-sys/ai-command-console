import { canonicalizeProposalReplayToString } from "./replayCanonicalizer";
import type {
  ProposalReplay,
  ProposalReplayAuditRecord,
  ProposalReplayCertification,
  ProposalReplayLineageRecord,
  ProposalReplaySnapshotBundle,
  ReplayDrift,
} from "./replayTypes";

export function serializeProposalReplay(value: ProposalReplay): string {
  return canonicalizeProposalReplayToString(value);
}

export function serializeProposalReplaySnapshotBundle(value: ProposalReplaySnapshotBundle): string {
  return canonicalizeProposalReplayToString(value);
}

export function serializeProposalReplayLineage(value: ProposalReplayLineageRecord): string {
  return canonicalizeProposalReplayToString(value);
}

export function serializeProposalReplayAuditRecord(value: ProposalReplayAuditRecord): string {
  return canonicalizeProposalReplayToString(value);
}

export function serializeProposalReplayDrift(value: ReplayDrift): string {
  return canonicalizeProposalReplayToString(value);
}

export function serializeProposalReplayCertification(value: ProposalReplayCertification): string {
  return canonicalizeProposalReplayToString(value);
}
