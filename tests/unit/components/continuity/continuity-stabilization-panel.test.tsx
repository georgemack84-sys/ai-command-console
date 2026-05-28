import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ContinuityStabilizationPanel } from "@/components/continuity/ContinuityStabilizationPanel";

describe("ContinuityStabilizationPanel", () => {
  it("renders stabilization status and blockers", () => {
    render(
      <ContinuityStabilizationPanel
        stewardship={{
          state: "DEGRADED",
          confidence: 0.57,
          shouldFreeze: false,
          shouldContain: false,
          shouldEscalate: true,
          governanceBlocked: false,
          verificationBlocked: true,
          stabilizationStatus: "degrading",
          survivabilityScore: 0.49,
          collapseRisk: "high",
          reasoning: ["RECOVERY_DEGRADATION_UNRESOLVED"],
          evidence: ["audit_1"],
        }}
      />,
    );

    expect(screen.getByText(/degrading/i)).toBeInTheDocument();
    expect(screen.getByText(/verification blocked: yes/i)).toBeInTheDocument();
  });
});
