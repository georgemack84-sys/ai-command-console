import type { GovernanceDriftError, GovernanceDriftInput } from "@/types/governance-drift";

export function detectEscalationDrift(input: GovernanceDriftInput): Readonly<{
  escalationAmplified: boolean;
  errors: readonly GovernanceDriftError[];
}> {
  const markers = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const drift = markers.includes("escalationomission")
    || markers.includes("escalationsuppression")
    || markers.includes("missingescalationlineage")
    || markers.includes("escalationmismatch")
    || markers.includes("uncertaintysuppression");
  if (!drift) {
    return Object.freeze({
      escalationAmplified: true,
      errors: Object.freeze([]),
    });
  }
  return Object.freeze({
    escalationAmplified: false,
    errors: Object.freeze([Object.freeze({
      code: "GOVERNANCE_DRIFT_ESCALATION_SUPPRESSION" as const,
      message: "Escalation drift or suppression was detected; uncertainty must increase oversight.",
      path: "metadata",
    })]),
  });
}
