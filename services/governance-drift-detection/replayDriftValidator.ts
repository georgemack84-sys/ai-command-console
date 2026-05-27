import type { GovernanceDriftError, GovernanceDriftInput } from "@/types/governance-drift";

function normalizeMarkers(value: unknown, buffer: string[]): void {
  if (typeof value === "string") {
    buffer.push(value.toLowerCase().replace(/[^a-z0-9]+/g, ""));
    return;
  }
  if (typeof value === "boolean" || typeof value === "number") {
    buffer.push(String(value).toLowerCase());
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) normalizeMarkers(item, buffer);
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      buffer.push(key.toLowerCase().replace(/[^a-z0-9]+/g, ""));
      normalizeMarkers(item, buffer);
    }
  }
}

export function validateReplayDrift(input: GovernanceDriftInput): Readonly<{
  replayDeterministic: boolean;
  errors: readonly GovernanceDriftError[];
}> {
  const markers: string[] = [];
  normalizeMarkers(input.metadata, markers);
  const errors: GovernanceDriftError[] = [];
  if (!input.replayAttackResult.record.replaySafe) {
    errors.push(Object.freeze({
      code: "GOVERNANCE_DRIFT_REPLAY_MISMATCH",
      message: "Upstream replay attack result was not replay-safe.",
      path: "replayAttackResult.record.replaySafe",
    }));
  }
  if (markers.some((item) =>
    item.includes("replaymismatch")
    || item.includes("replaylineagecorruption")
    || item.includes("reconstructiondivergence")
    || item.includes("deterministicreplayfailure")
    || item.includes("replaycontinuitybreaks")
    || item.includes("replayrepair")
    || item.includes("syntheticlineagerepair")
    || item.includes("replaygapinjection")
  )) {
    errors.push(Object.freeze({
      code: markers.some((item) => item.includes("replayrepair") || item.includes("syntheticlineagerepair"))
        ? "GOVERNANCE_DRIFT_REPLAY_REPAIR"
        : "GOVERNANCE_DRIFT_REPLAY_MISMATCH",
      message: "Replay drift, corruption, or replay repair markers were detected.",
      path: "metadata",
    }));
  }
  if (markers.some((item) => item.includes("currentstatesubstitution"))) {
    errors.push(Object.freeze({
      code: "GOVERNANCE_DRIFT_CURRENT_STATE_SUBSTITUTION",
      message: "Current-state substitution is forbidden in drift replay validation.",
      path: "metadata",
    }));
  }
  return Object.freeze({
    replayDeterministic: errors.length === 0,
    errors: Object.freeze(errors),
  });
}
