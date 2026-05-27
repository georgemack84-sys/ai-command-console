import type { GovernanceDriftError, GovernanceDriftInput } from "@/types/governance-drift";

export function validateDependencyDrift(input: GovernanceDriftInput): Readonly<{
  dependencySafe: boolean;
  errors: readonly GovernanceDriftError[];
}> {
  const markers = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const drift = markers.includes("approvalmismatch")
    || markers.includes("revokeddependencyreuse")
    || markers.includes("staleapprovalreplay")
    || markers.includes("dependencytopologycorruption")
    || markers.includes("circulardependencyemergence")
    || input.replayAttackResult.errors.some((item) => item.code.includes("TOPOLOGY"));
  if (!drift) {
    return Object.freeze({
      dependencySafe: true,
      errors: Object.freeze([]),
    });
  }
  return Object.freeze({
    dependencySafe: false,
    errors: Object.freeze([Object.freeze({
      code: "GOVERNANCE_DRIFT_DEPENDENCY_CORRUPTION" as const,
      message: "Dependency drift or stale approval dependency reuse was detected.",
      path: "metadata",
    })]),
  });
}
