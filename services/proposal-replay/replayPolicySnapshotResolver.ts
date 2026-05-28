import type { ProposalReplaySnapshotBundle } from "./replayTypes";

export function resolveReplayPolicySnapshot(bundle: ProposalReplaySnapshotBundle): string {
  return bundle.governanceSnapshot.policySnapshotId;
}
