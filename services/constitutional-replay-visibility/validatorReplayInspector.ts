import type { ValidatorReplayInspection } from "@/types/constitutional-replay";
import { hashConstitutionalReplayValue } from "@/services/constitutional-replay-attack/deterministicReplayHasher";

export function inspectValidatorReplay(input: {
  validatorVersionId: string;
  validatorDeterministic: boolean;
}): ValidatorReplayInspection {
  return Object.freeze({
    ...input,
    inspectionHash: hashConstitutionalReplayValue("validator-replay-inspection", input),
  });
}
