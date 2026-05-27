import { clampMetric } from "../stability/stabilityMetrics";

export function buildExecutiveEscalationAnalysis(input: {
  escalationChain: string[];
  escalationRequired: boolean;
  blockedReasons: string[];
  supervisionState: string;
  escalationPressure: number;
  governanceViolations: string[];
}) {
  return {
    escalationTimeline: input.escalationChain,
    escalationRequired: input.escalationRequired,
    escalationSaturation: clampMetric(
      input.escalationPressure * 0.65
        + (input.blockedReasons.length > 0 ? 0.15 : 0.05)
        + (input.governanceViolations.length > 0 ? 0.15 : 0.05),
      0.05,
    ),
    emergencyAutonomyFreeze: ["FROZEN", "DISPUTED", "BLOCKED", "CONTAINING"].includes(input.supervisionState),
    constitutionalFreezeVisible: input.blockedReasons.includes("REPLAY_MISMATCH_UNRESOLVED")
      || input.blockedReasons.includes("COORDINATION_FREEZE_ACTIVE"),
  };
}
