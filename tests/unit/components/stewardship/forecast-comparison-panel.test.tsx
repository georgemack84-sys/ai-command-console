import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ForecastComparisonPanel } from "@/components/stewardship/ForecastComparisonPanel";

describe("ForecastComparisonPanel", () => {
  it("renders side-by-side simulation comparisons", () => {
    render(
      <ForecastComparisonPanel
        forecasting={{
          advisoryOnly: true,
          simulations: [{
            simulationId: "simulation:containment:0",
            simulationType: "CONTAINMENT",
            projectedOutcome: "CONTAINMENT_REQUIRED",
            survivabilityScore: 0.4,
            continuityConfidence: 0.35,
            escalationProbability: 0.62,
            operationalTrustProjection: 0.3,
            projectedSubsystemFailures: ["queue"],
            projectedEscalations: ["containment_escalation"],
            confidenceScore: 0.41,
            uncertaintyLevel: "HIGH",
            forecastLineage: ["simulation:containment"],
            evidenceSources: ["audit_1"],
            generatedAt: "2026-05-09T00:00:00.000Z",
          }],
          confidenceDegradationReasons: [],
          evidenceSufficient: true,
          collapseRisk: 0.5,
          containmentPressure: 0.66,
          governanceInstabilityRisk: 0.4,
          operationalTrustProjection: 0.3,
          generatedAt: "2026-05-09T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText(/containment_required/i)).toBeInTheDocument();
  });
});
