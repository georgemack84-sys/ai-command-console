import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RuntimeStabilityPanel } from "@/components/stewardship/RuntimeStabilityPanel";
import { ConstitutionalResilienceState } from "@/services/resilience/resilienceTypes";

describe("RuntimeStabilityPanel", () => {
  it("renders runtime stability fields", () => {
    render(
      <RuntimeStabilityPanel
        runtimeStability={{
          operationalState: "UNSTABLE",
          survivabilityScore: 0.31,
          degradationRate: 0.7,
          recoveryPressure: 0.66,
          escalationPressure: 0.61,
          continuityConfidence: 0.28,
          unstableSubsystems: ["replay", "locks"],
          stabilizationRequired: true,
          timestamp: "2026-05-09T00:00:00.000Z",
        }}
        resilienceState={ConstitutionalResilienceState.CRITICAL}
      />,
    );

    expect(screen.getByText(/unstable/i)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
