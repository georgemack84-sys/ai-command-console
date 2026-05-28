import type { AutonomyReadinessProfile } from "@/types/autonomy-readiness";
import type { SafeActionDefinition, SafeActionScope } from "@/types/safe-action-catalog";

const DISPUTED_STATES = new Set(["disputed", "forbidden", "revoked"] as const);

export function validateSafeActionScope(
  readinessProfile: AutonomyReadinessProfile,
  definition: SafeActionDefinition,
): SafeActionScope {
  const currentLevel = readinessProfile.autonomyLevel;
  const readinessState = readinessProfile.derivedState;
  const withinAuthorityCeiling = currentLevel <= readinessProfile.authorityCeiling.ceilingLevel;
  const allowedNow = definition.allowedAutonomyLevels.includes(currentLevel as "A0" | "A1" | "A2");
  const futureBound = definition.futureBoundLevels.includes(currentLevel as "A3" | "A4" | "A5");
  const reasons: string[] = [];

  let state: SafeActionScope["state"] = "allowed";

  if (DISPUTED_STATES.has(readinessState as typeof DISPUTED_STATES extends Set<infer T> ? T : never)) {
    state = readinessState === "disputed" ? "disputed" : "denied";
    reasons.push("Readiness state is not eligible for safe action derivation.");
  }
  if (!withinAuthorityCeiling) {
    state = "denied";
    reasons.push("Action exceeds the immutable authority ceiling.");
  }
  if (readinessProfile.snapshotLineageHashes.length === 0) {
    state = "denied";
    reasons.push("Snapshot lineage is required for safe action scope validation.");
  }
  if (futureBound) {
    state = state === "denied" ? state : "future_bound";
    reasons.push("Future-bound autonomy levels remain non-executing conceptual states.");
  }
  if (!allowedNow && !futureBound) {
    state = "denied";
    reasons.push("Current autonomy level is outside the declared safe action scope.");
  }
  if (currentLevel === "A6") {
    state = "denied";
    reasons.push("A6 is permanently forbidden.");
  }

  return Object.freeze({
    state,
    currentLevel,
    readinessState,
    allowedNow: state === "allowed",
    futureBound,
    withinAuthorityCeiling,
    snapshotLineageHashes: Object.freeze([...readinessProfile.snapshotLineageHashes]),
    reasons: Object.freeze(reasons),
  });
}
