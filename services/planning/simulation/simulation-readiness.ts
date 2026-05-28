import { buildSimulationLineageContext } from "./simulation-context";
import { orchestrateSimulation } from "./simulation-orchestrator";
import type { SimulationBuildInput, SimulationReadiness } from "./simulation-types";

export function buildSimulationReadiness(input: SimulationBuildInput): SimulationReadiness {
  const lineage = buildSimulationLineageContext(input.versionedReplayArtifact);
  const simulated = orchestrateSimulation(input);

  return {
    ready: simulated.result.status === "success" || simulated.result.status === "partial",
    failures: simulated.result.failures,
    warnings: simulated.warnings,
    lineage,
    derivedSimulationHash: simulated.result.derivedSimulationHash,
  };
}
