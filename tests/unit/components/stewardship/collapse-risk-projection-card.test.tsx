import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CollapseRiskProjectionCard } from "@/components/stewardship/CollapseRiskProjectionCard";

describe("CollapseRiskProjectionCard", () => {
  it("renders advisory collapse risk only", () => {
    render(
      <CollapseRiskProjectionCard
        forecasting={{
          advisoryOnly: true,
          simulations: [],
          confidenceDegradationReasons: [],
          evidenceSufficient: true,
          collapseRisk: 0.81,
          containmentPressure: 0.68,
          governanceInstabilityRisk: 0.57,
          operationalTrustProjection: 0.24,
          generatedAt: "2026-05-09T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText(/81%/i)).toBeInTheDocument();
    expect(screen.getByText(/advisory only: yes/i)).toBeInTheDocument();
  });
});
