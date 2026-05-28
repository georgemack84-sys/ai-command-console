import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RecoverySimulationPanel } from "@/components/continuity/RecoverySimulationPanel";

describe("RecoverySimulationPanel", () => {
  it("renders dry-run simulation outcomes and disputes", () => {
    render(
      <RecoverySimulationPanel
        simulationOutcomes={[{
          simulationId: "sim-1",
          executionId: "exec-1",
          scenarioType: "REPLAY_RECOVERY",
          outcome: "REPLAY_DIVERGENCE_DETECTED",
          warnings: [],
          disputes: ["STATE_DIVERGENCE"],
        }]}
      />,
    );

    expect(screen.getByText(/REPLAY_RECOVERY/i)).toBeInTheDocument();
    expect(screen.getByText(/STATE_DIVERGENCE/i)).toBeInTheDocument();
  });
});
