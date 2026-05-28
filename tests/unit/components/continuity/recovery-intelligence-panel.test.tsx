import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RecoveryIntelligencePanel } from "@/components/continuity/RecoveryIntelligencePanel";

describe("RecoveryIntelligencePanel", () => {
  it("renders collapse risk and stewardship reasoning", () => {
    render(
      <RecoveryIntelligencePanel
        stewardship={{
          state: "ESCALATED",
          confidence: 0.34,
          shouldFreeze: false,
          shouldContain: true,
          shouldEscalate: true,
          governanceBlocked: true,
          verificationBlocked: true,
          stabilizationStatus: "unstable",
          survivabilityScore: 0.22,
          collapseRisk: "critical",
          reasoning: ["RECOVERY_GOVERNANCE_CONFLICT", "replay_divergence_detected"],
          evidence: ["audit_1", "audit_2"],
        }}
      />,
    );

    expect(screen.getByText(/critical/i)).toBeInTheDocument();
    expect(screen.getByText(/RECOVERY_GOVERNANCE_CONFLICT/i)).toBeInTheDocument();
  });
});
