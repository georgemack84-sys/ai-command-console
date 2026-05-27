import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StabilityMetricsPanel } from "@/components/continuity/StabilityMetricsPanel";

describe("StabilityMetricsPanel", () => {
  it("renders pressure and confidence indicators", () => {
    render(
      <StabilityMetricsPanel
        stability={{
          operationalState: "WATCH",
          survivabilityScore: 0.74,
          degradationRate: 0.24,
          recoveryPressure: 0.31,
          escalationPressure: 0.18,
          continuityConfidence: 0.77,
          unstableSubsystems: ["queue"],
          stabilizationRequired: false,
          containmentRecommended: false,
          lockdownRecommended: false,
          replayInstabilityScore: 0.12,
          staleExecutionSpread: 0.08,
          dependencyInstabilityScore: 0.2,
          operatorInterventionPressure: 0.1,
          recoverySuccessConfidence: 0.82,
          trend: "STABLE",
          confidence: 0.8,
          reasons: ["degraded_dependencies_present"],
          disputed: false,
          timestamp: "2026-05-09T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText(/recovery pressure: 31%/i)).toBeInTheDocument();
    expect(screen.getByText(/unstable subsystems: queue/i)).toBeInTheDocument();
  });
});
