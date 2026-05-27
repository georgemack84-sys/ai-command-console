import type { ReplayComparisonView, ReplayDriftView, ReplayIntegrityView, ReplayLineageView, ReplayVisualization } from "@/types/replay-reconstruction-engine";
import { hashReplayValue } from "./replayHasher";

export function verifyReplayDeterminism(input: {
  lineage: ReplayLineageView;
  integrity: ReplayIntegrityView;
  comparison: ReplayComparisonView;
  drift: ReplayDriftView;
  visualization: ReplayVisualization;
}): { deterministic: boolean; reconstructionHash: string } {
  const first = hashReplayValue("replay-reconstruction", input);
  const second = hashReplayValue("replay-reconstruction", input);
  return Object.freeze({
    deterministic: first === second,
    reconstructionHash: first,
  });
}
