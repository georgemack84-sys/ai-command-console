import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RecoveryStewardshipPanel } from "@/components/continuity/RecoveryStewardshipPanel";

describe("RecoveryStewardshipPanel", () => {
  it("renders stewardship state and control decisions", () => {
    render(
      <RecoveryStewardshipPanel
        stewardship={{
          state: "FROZEN",
          confidence: 0.41,
          shouldFreeze: true,
          shouldContain: false,
          shouldEscalate: true,
          governanceBlocked: true,
          verificationBlocked: false,
          stabilizationStatus: "degrading",
          survivabilityScore: 0.38,
          collapseRisk: "high",
          reasoning: ["RECOVERY_CONFLICTING_RECOVERIES"],
          evidence: ["audit_1"],
        }}
      />,
    );

    expect(screen.getByText(/frozen/i)).toBeInTheDocument();
    expect(screen.getByText(/freeze: required/i)).toBeInTheDocument();
    expect(screen.getByText(/escalate: required/i)).toBeInTheDocument();
  });
});
