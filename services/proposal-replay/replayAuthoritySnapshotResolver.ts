import type { ProposalReplaySnapshotBundle } from "./replayTypes";

export function resolveReplayAuthoritySnapshot(bundle: ProposalReplaySnapshotBundle): string {
  return bundle.authorityBoundary.authorityBoundaryId;
}
