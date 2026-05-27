import type { ConstitutionalGovernanceInput, SimulationScope } from "@/types/constitutional-governance";

export function evaluateSimulationGovernance(input: ConstitutionalGovernanceInput): SimulationScope {
  const readOnly = input.consoleView.simulation.data.readOnly;
  const allowed = readOnly && input.replay.status === "RECONSTRUCTED";

  return Object.freeze({
    decision: allowed ? "ALLOW" : "DENY",
    readOnly: true,
    branchSimulationVisible: input.consoleView.simulation.data.branchOutcomes.length > 0,
    alternateOutcomeVisible: input.consoleView.simulation.data.branchOutcomes.length > 0,
    deniedOperations: Object.freeze(["execute", "orchestrate", "mutate-runtime", "mutate-policy"]),
    evidenceLinks: Object.freeze([
      {
        label: "Simulation visibility",
        authority: "control-plane.simulation" as const,
        hash: input.replay.reconstructionHash,
        ref: input.replay.replayId,
      },
      {
        label: "Replay comparison",
        authority: "4.4E.replay-reconstruction-engine" as const,
        hash: input.replay.reconstructionHash,
        ref: input.replay.replayId,
      },
    ]),
  });
}
