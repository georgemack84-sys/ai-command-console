import { hashGovernanceDriftValue } from "@/services/governance-drift-detection/deterministicDriftHasher";

export function buildGovernanceDriftReplayLineage(input: {
  replayLedgerId: string;
  replayDeterministic: boolean;
}) {
  return Object.freeze({
    replayLedgerId: input.replayLedgerId,
    replayDeterministic: input.replayDeterministic,
    replayHash: hashGovernanceDriftValue("replay-lineage", input),
  });
}
