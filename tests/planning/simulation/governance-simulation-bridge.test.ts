import { describe, expect, it } from "vitest";

import { buildGovernanceSimulationBridge } from "@/services/planning/simulation";
import { buildSimulationFixture } from "@/tests/planning/simulation/helpers";

describe("governance simulation bridge", () => {
  it("surfaces governance blocks without bypassing them", () => {
    const fixture = buildSimulationFixture();
    fixture.executionTruthPackage.governanceEnvelope.allowed = false;
    fixture.executionTruthPackage.governanceEnvelope.blockedReasons = ["approval required"];

    const bridge = buildGovernanceSimulationBridge(
      fixture.executionTruthPackage,
      fixture.executionCompatibilityContract,
    );

    expect(bridge.failures.some((failure) => failure.code === "SIMULATION_GOVERNANCE_BLOCK")).toBe(true);
    expect(bridge.blockedOperations).toHaveLength(1);
  });
});
