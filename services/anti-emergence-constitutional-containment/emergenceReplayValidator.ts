import type { AntiEmergenceError, AntiEmergenceInput } from "./antiEmergenceStateTypes";
import { normalizeAntiEmergenceMetadata } from "./antiEmergenceSchemas";

export function validateEmergenceReplay(input: AntiEmergenceInput): readonly AntiEmergenceError[] {
  const normalized = normalizeAntiEmergenceMetadata(input.metadata);
  if (
    input.constitutionalReplayResult.record.classification !== "STABLE"
    || normalized.includes("replaydivergence")
    || normalized.includes("replayhiddentransitions")
    || normalized.includes("replaysuppression")
  ) {
    return Object.freeze([Object.freeze({
      code: "ANTI_EMERGENCE_REPLAY_MISMATCH",
      message: "Replay divergence, hidden transitions, or replay suppression markers were detected.",
      path: "constitutionalReplayResult.record.classification",
    })]);
  }
  return Object.freeze([]);
}
