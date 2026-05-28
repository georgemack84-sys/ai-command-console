import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SimulationIntelligencePanel } from "@/components/stewardship/SimulationIntelligencePanel";

describe("SimulationIntelligencePanel", () => {
  it("renders simulation lineage and projected escalations", () => {
    render(
      <SimulationIntelligencePanel
        forecasting={{
          advisoryOnly: true,
          simulations: [{
            simulationId: "simulation:replay:0",
            simulationType: "REPLAY",
            projectedOutcome: "PARTIAL_SUCCESS",
            survivabilityScore: 0.6,
            continuityConfidence: 0.55,
            escalationProbability: 0.4,
            operationalTrustProjection: 0.58,
            projectedSubsystemFailures: [],
            projectedEscalations: ["recovery_escalation"],
            confidenceScore: 0.61,
            uncertaintyLevel: "MODERATE",
            forecastLineage: ["simulation:replay", "execution:exec_1"],
            evidenceSources: ["audit_1"],
            generatedAt: "2026-05-09T00:00:00.000Z",
          }],
          confidenceDegradationReasons: ["convergence_not_achieved"],
          evidenceSufficient: true,
          collapseRisk: 0.4,
          containmentPressure: 0.45,
          governanceInstabilityRisk: 0.32,
          operationalTrustProjection: 0.58,
          generatedAt: "2026-05-09T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText(/simulation:replay, execution:exec_1/i)).toBeInTheDocument();
  });
});
