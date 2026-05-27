import type { ReplayBoundaryInspection } from "@/types/constitutional-replay";
import { hashConstitutionalReplayValue } from "@/services/constitutional-replay-attack/deterministicReplayHasher";

export function inspectReplayBoundary(input: {
  topologyFrozen: boolean;
  isolationSafe: boolean;
}): ReplayBoundaryInspection {
  return Object.freeze({
    ...input,
    inspectionHash: hashConstitutionalReplayValue("replay-boundary-inspection", input),
  });
}
