import type { GovernanceReplayAttackInspection } from "@/types/constitutional-replay";
import { hashConstitutionalReplayValue } from "@/services/constitutional-replay-attack/deterministicReplayHasher";

export function inspectGovernanceReplay(input: {
  governanceSnapshotId: string;
  governanceLinked: boolean;
}): GovernanceReplayAttackInspection {
  return Object.freeze({
    ...input,
    inspectionHash: hashConstitutionalReplayValue("governance-replay-inspection", input),
  });
}
