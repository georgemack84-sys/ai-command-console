import { ConstitutionalResilienceState } from "./constitutionalResilienceEngine";

export function buildSurvivabilityProtocols(input: {
  resilienceState: ConstitutionalResilienceState;
  blockedReasons: string[];
  emergencyControlsRequired: boolean;
  containmentRequired: boolean;
}) {
  return {
    protocols: Array.from(new Set([
      "preserve_audit_lineage",
      "preserve_replay_safety",
      ...(input.containmentRequired ? ["preserve_containment_boundary"] : []),
      ...(input.emergencyControlsRequired ? ["constitutional_emergency_review"] : []),
      ...(input.blockedReasons.length > 0 ? ["freeze_unsafe_progression"] : []),
    ])).sort(),
    advisoryOnly: true as const,
    resilienceState: input.resilienceState,
  };
}
