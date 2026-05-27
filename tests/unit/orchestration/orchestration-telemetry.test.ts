import { describe, expect, it } from "vitest";

import { buildOrchestrationTelemetry } from "@/services/orchestration/orchestrationTelemetry";

describe("buildOrchestrationTelemetry", () => {
  it("tracks denied operations and arbitration outcomes deterministically", () => {
    const result = buildOrchestrationTelemetry({
      governanceConfidence: 0.4,
      deniedOperations: 1,
      escalationTriggers: 1,
      containmentTriggers: 1,
      arbitrationOutcome: 0.2,
      supervisionConfidence: 0.5,
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(result).toHaveLength(6);
  });
});
