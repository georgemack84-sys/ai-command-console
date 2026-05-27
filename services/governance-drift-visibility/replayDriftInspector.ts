import type { ReplayDriftInspection } from "@/types/governance-drift";
import { hashGovernanceDriftValue } from "@/services/governance-drift-detection/deterministicDriftHasher";

export function inspectReplayDrift(input: {
  replayId: string;
  replayDeterministic: boolean;
  replayState: string;
  replayLedgerId: string;
}): ReplayDriftInspection {
  return Object.freeze({
    ...input,
    inspectionHash: hashGovernanceDriftValue("replay-drift-inspection", input),
  });
}
