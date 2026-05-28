import type {
  SimulationScenarioDefinition,
  SimulationScenarioType,
} from "./simulationStateTypes";
import { hashSimulationValue } from "./simulationTraceHasher";

const SCENARIOS: readonly Readonly<{
  scenarioType: SimulationScenarioType;
  description: string;
  weight: number;
}>[] = Object.freeze([
  { scenarioType: "ESCALATION_PROPAGATION", description: "Model replay, governance, and containment escalation propagation.", weight: 15 },
  { scenarioType: "AUTHORITY_REVOCATION", description: "Model operator and governance revocation against authority ceilings.", weight: 15 },
  { scenarioType: "COORDINATION_STRESS", description: "Model recursive coordination and stale routing pressure.", weight: 12 },
  { scenarioType: "GOVERNANCE_CONFLICT", description: "Model governance rule, approval, and escalation conflicts.", weight: 14 },
  { scenarioType: "REPLAY_FAILURE", description: "Model replay drift, missing snapshots, and stale validator conditions.", weight: 14 },
  { scenarioType: "OPERATOR_INTERVENTION", description: "Model freezes, overrides, and scenario termination under operator supremacy.", weight: 10 },
  { scenarioType: "RUNTIME_INSTABILITY", description: "Model confidence collapse, telemetry gaps, and runtime instability pressure.", weight: 10 },
  { scenarioType: "CONTAINMENT_PRESSURE", description: "Model containment pressure without granting containment control.", weight: 10 },
]);

export function getSimulationScenarioRegistry(simulationId: string): readonly SimulationScenarioDefinition[] {
  return Object.freeze(SCENARIOS.map((item) => Object.freeze({
    scenarioId: hashSimulationValue("constitutional-runtime-simulation-scenario-id", {
      simulationId,
      scenarioType: item.scenarioType,
    }),
    scenarioType: item.scenarioType,
    description: item.description,
    weight: item.weight,
    deterministicHash: hashSimulationValue("constitutional-runtime-simulation-scenario", {
      simulationId,
      scenarioType: item.scenarioType,
      description: item.description,
      weight: item.weight,
    }),
  })));
}
