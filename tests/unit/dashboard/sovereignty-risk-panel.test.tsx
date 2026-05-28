import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SovereigntyRiskPanel } from "@/components/governance/SovereigntyRiskPanel";

describe("SovereigntyRiskPanel", () => {
  it("renders sovereignty monitoring without control actions", () => {
    render(
      <SovereigntyRiskPanel
        sovereigntyState="UNSTABLE"
        systemicRisk={0.42}
        survivabilityRisk={0.33}
        governanceDegradation={0.28}
        escalationSaturation={0.41}
        containmentEffectiveness={0.72}
        sovereigntyConfidence={0.67}
        unstableDomains={["replay"]}
        emergencyContainmentState={false}
        constitutionalSurvivabilityStatus="WATCH"
      />,
    );

    expect(screen.getByText(/sovereignty risk/i)).toBeInTheDocument();
    expect(screen.getByText("UNSTABLE")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
