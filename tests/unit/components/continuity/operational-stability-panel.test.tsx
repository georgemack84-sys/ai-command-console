import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OperationalStabilityPanel } from "@/components/continuity/OperationalStabilityPanel";

describe("OperationalStabilityPanel", () => {
  it("renders operational stability state and recommendations", () => {
    render(
      <OperationalStabilityPanel
        stability={{
          operationalState: "CRITICAL",
          survivabilityScore: 0.22,
          degradationRate: 0.71,
          recoveryPressure: 0.66,
          escalationPressure: 0.58,
          continuityConfidence: 0.31,
          unstableSubsystems: ["workers", "replay"],
          stabilizationRequired: true,
          containmentRecommended: true,
          lockdownRecommended: false,
          replayInstabilityScore: 0.8,
          staleExecutionSpread: 0.6,
          dependencyInstabilityScore: 0.45,
          operatorInterventionPressure: 0.4,
          recoverySuccessConfidence: 0.2,
          trend: "DECLINING",
          confidence: 0.35,
          reasons: ["replay_divergence_detected"],
          disputed: false,
          timestamp: "2026-05-09T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText(/critical/i)).toBeInTheDocument();
    expect(screen.getByText(/containment: recommended/i)).toBeInTheDocument();
  });
});
