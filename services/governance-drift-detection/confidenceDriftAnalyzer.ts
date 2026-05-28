import type { GovernanceDriftError, GovernanceDriftInput } from "@/types/governance-drift";

export function analyzeConfidenceDrift(input: GovernanceDriftInput): Readonly<{
  confidenceLinked: boolean;
  confidenceSafe: boolean;
  errors: readonly GovernanceDriftError[];
}> {
  const markers = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const drift = markers.includes("unsupportedconfidenceinflation")
    || markers.includes("unexplainedconfidencemutation")
    || markers.includes("confidencereplaymismatch")
    || markers.includes("confidencediscontinuity")
    || markers.includes("confidencelineagecorruption");
  if (!drift) {
    return Object.freeze({
      confidenceLinked: true,
      confidenceSafe: true,
      errors: Object.freeze([]),
    });
  }
  return Object.freeze({
    confidenceLinked: false,
    confidenceSafe: false,
    errors: Object.freeze([Object.freeze({
      code: "GOVERNANCE_DRIFT_CONFIDENCE_CORRUPTION" as const,
      message: "Confidence drift was detected without support from immutable evidence.",
      path: "metadata",
    })]),
  });
}
