import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RecoveryForecastingPanel } from "@/components/stewardship/RecoveryForecastingPanel";

describe("RecoveryForecastingPanel", () => {
  it("renders projected recovery outcomes read-only", () => {
    render(
      <RecoveryForecastingPanel
        forecasting={{
          advisoryOnly: true,
          simulations: [],
          confidenceDegradationReasons: [],
          evidenceSufficient: true,
          collapseRisk: 0.22,
          containmentPressure: 0.33,
          governanceInstabilityRisk: 0.2,
          operationalTrustProjection: 0.72,
          generatedAt: "2026-05-09T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText(/simulations: 0/i)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
