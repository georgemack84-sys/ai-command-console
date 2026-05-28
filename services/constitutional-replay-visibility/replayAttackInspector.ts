import type { ConstitutionalReplayInspection } from "@/types/constitutional-replay";
import { hashConstitutionalReplayValue } from "@/services/constitutional-replay-attack/deterministicReplayHasher";

export function inspectReplayAttack(input: {
  replayAttackId: string;
  coordinationId: string;
  replayAttackState: string;
  categories: readonly string[];
}): ConstitutionalReplayInspection {
  return Object.freeze({
    ...input,
    inspectionHash: hashConstitutionalReplayValue("replay-attack-inspection", input),
  });
}
