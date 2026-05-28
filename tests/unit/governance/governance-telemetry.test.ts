import { describe, expect, it } from "vitest";

import { buildGovernanceTelemetry } from "@/services/governance/governanceTelemetry";

describe("buildGovernanceTelemetry", () => {
  it("builds deterministic governance telemetry points", () => {
    const result = buildGovernanceTelemetry({
      governanceConfidence: 0.72,
      deniedOperations: 1,
      containmentTriggers: 1,
      escalationTriggers: 0,
      emergencyGovernanceActivations: 0,
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(result).toHaveLength(5);
    expect(result[0]?.timestamp).toBe("2026-05-09T00:00:00.000Z");
  });
});
