import { describe, expect, it } from "vitest";

import { buildIntentCoordinationGovernanceRecord } from "@/services/intent-coordination-governance-core";
import { buildIntentCoordinationGovernanceFixture } from "./helpers";

describe("intent coordination adversarial constraints", () => {
  it("fails closed on execution-shaped metadata", () => {
    const { input } = buildIntentCoordinationGovernanceFixture({
      metadata: Object.freeze({ executionHandle: "run-now" }),
    });
    const result = buildIntentCoordinationGovernanceRecord(input);
    expect(result.errors.some((error) => error.code === "COORDINATION_EXECUTION_LEAK")).toBe(true);
  });

  it("fails closed on dynamic authority expansion attempts", () => {
    const base = buildIntentCoordinationGovernanceFixture();
    const { input } = buildIntentCoordinationGovernanceFixture({
      topology: Object.freeze({
        ...base.input.topology,
        relationships: Object.freeze([
          ...base.input.topology.relationships,
          Object.freeze({
            relationshipId: "rel-bad",
            parentIntentId: "intent-root",
            childIntentId: "intent-child-2",
            relationshipType: "approval" as const,
            governanceBindings: Object.freeze([base.input.governanceView.constitutionalDecisionHash]),
            replaySafe: true as const,
            executionAuthority: true as unknown as false,
          }),
        ]),
      }),
    });
    const result = buildIntentCoordinationGovernanceRecord(input);
    expect(result.errors.some((error) => error.code === "COORDINATION_EXECUTION_LEAK")).toBe(true);
  });
});
