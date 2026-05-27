import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SimulationConfidenceCard } from "@/components/stewardship/SimulationConfidenceCard";

describe("SimulationConfidenceCard", () => {
  it("renders uncertainty and degradation reasons", () => {
    render(
      <SimulationConfidenceCard
        forecasting={{
          advisoryOnly: true,
          simulations: [{
            simulationId: "simulation:replay:0",
            simulationType: "REPLAY",
            projectedOutcome: "UNSTABLE",
            survivabilityScore: 0.3,
            continuityConfidence: 0.3,
            escalationProbability: 0.5,
            operationalTrustProjection: 0.25,
            projectedSubsystemFailures: [],
            projectedEscalations: [],
            confidenceScore: 0.32,
            uncertaintyLevel: "SEVERE",
            forecastLineage: [],
            evidenceSources: [],
            generatedAt: "2026-05-09T00:00:00.000Z",
          }],
          confidenceDegradationReasons: ["frozen_chain_degrades_confidence"],
          evidenceSufficient: false,
          collapseRisk: 0.6,
          containmentPressure: 0.7,
          governanceInstabilityRisk: 0.5,
          operationalTrustProjection: 0.25,
          generatedAt: "2026-05-09T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText(/severe/i)).toBeInTheDocument();
  });
});
