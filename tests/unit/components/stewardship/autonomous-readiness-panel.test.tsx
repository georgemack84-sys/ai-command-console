import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AutonomousReadinessPanel } from "@/components/stewardship/AutonomousReadinessPanel";
import type { AutonomousRecoveryReadinessAssessment } from "@/services/readiness/readinessTypes";

const readiness: AutonomousRecoveryReadinessAssessment = {
  readinessState: "GOVERNANCE_REVIEW_REQUIRED",
  readinessScore: 68,
  governanceConfidence: 0.76,
  simulationTrustScore: 0.72,
  rollbackConfidence: 0.81,
  containmentConfidence: 0.69,
  convergenceConfidence: 0.73,
  escalationReliability: 0.7,
  constitutionalIntegrity: 0.82,
  auditCompleteness: 0.77,
  recoveryIntelligenceStability: 0.66,
  requiresOperatorApproval: true,
  autonomyBlockedReasons: ["simulation_trust_below_threshold"],
  advisoryOnly: true,
  liveAutonomyEnabled: false,
  evaluatedDomains: ["GOVERNANCE", "SIMULATION", "CONSTITUTIONAL"],
  timestamp: "2026-05-09T00:00:00.000Z",
};

describe("AutonomousReadinessPanel", () => {
  it("renders readiness as display-only", () => {
    render(<AutonomousReadinessPanel readiness={readiness} />);

    expect(screen.getByText(/autonomous recovery readiness/i)).toBeInTheDocument();
    expect(screen.getByText("GOVERNANCE_REVIEW_REQUIRED")).toBeInTheDocument();
    expect(screen.getByText(/advisory only: yes/i)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
