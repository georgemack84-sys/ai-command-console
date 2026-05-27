import type { ProposalReplaySnapshotBundle } from "./replayTypes";

export function resolveReplayGovernanceSnapshot(bundle: ProposalReplaySnapshotBundle): string {
  return bundle.governanceSnapshot.governanceSnapshotId;
}
