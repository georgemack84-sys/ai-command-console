import { describe, expect, it } from "vitest";

import { aggregateRecoveryDivergence } from "../../../../services/recovery/verification/recoveryDivergenceAggregator";

describe("recovery divergence aggregator", () => {
  it("aggregates replay, simulation, and governance divergence deterministically", () => {
    const result = aggregateRecoveryDivergence({
      replayDisputes: ["STATE_DIVERGENCE", "OUTPUT_DIVERGENCE"],
      simulationDisputes: ["LEASE_CONFLICT"],
      continuityDisputes: ["CHECKPOINT_DIVERGENCE"],
      governanceDisputes: ["RECOVERY_GOVERNANCE_BLOCKED"],
    });

    expect(result.divergenceDetected).toBe(true);
    expect(result.replayDivergenceCount).toBe(2);
    expect(result.disputes).toEqual([
      "CHECKPOINT_DIVERGENCE",
      "LEASE_CONFLICT",
      "OUTPUT_DIVERGENCE",
      "RECOVERY_GOVERNANCE_BLOCKED",
      "STATE_DIVERGENCE",
    ]);
  });
});
