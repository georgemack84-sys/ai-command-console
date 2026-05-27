import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ConstitutionalSimulationPanel } from "@/components/governance/ConstitutionalSimulationPanel";

describe("ConstitutionalSimulationPanel", () => {
  it("renders deterministic read-only forecasts", () => {
    render(
      <ConstitutionalSimulationPanel
        simulations={[{
          simulationId: "simulation_1",
          simulationType: "governance_conflict",
          deterministic: true,
          constitutionalSafe: false,
          uncertaintyLevel: 0.2,
          survivabilityScore: 0.7,
          escalationRisk: 0.4,
          containmentFailureProbability: 0.3,
          governanceIntegrityForecast: 0.6,
          unstableDomains: ["replay"],
          projectedInterventions: ["operator_review_required"],
          forecastLineageId: "lineage_1",
          evidenceReferences: ["audit_1"],
          createdAt: 1,
        }]}
      />,
    );

    expect(screen.getByText(/constitutional simulation/i)).toBeInTheDocument();
    expect(screen.getByText(/deterministic: yes/i)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
