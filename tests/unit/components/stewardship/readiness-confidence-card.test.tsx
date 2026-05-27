import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReadinessConfidenceCard } from "@/components/stewardship/ReadinessConfidenceCard";
import type { AutonomousRecoveryReadinessAssessment } from "@/services/readiness/readinessTypes";

const readiness: AutonomousRecoveryReadinessAssessment = {
  readinessState: "LIMITED_READINESS",
  readinessScore: 74,
  governanceConfidence: 0.8,
  simulationTrustScore: 0.71,
  rollbackConfidence: 0.83,
  containmentConfidence: 0.76,
  convergenceConfidence: 0.75,
  escalationReliability: 0.7,
  constitutionalIntegrity: 0.84,
  auditCompleteness: 0.79,
  recoveryIntelligenceStability: 0.68,
  requiresOperatorApproval: true,
  autonomyBlockedReasons: [],
  advisoryOnly: true,
  liveAutonomyEnabled: false,
  evaluatedDomains: ["GOVERNANCE", "SIMULATION", "CONSTITUTIONAL"],
  timestamp: "2026-05-09T00:00:00.000Z",
};

describe("ReadinessConfidenceCard", () => {
  it("renders readiness confidence domains with no controls", () => {
    render(<ReadinessConfidenceCard readiness={readiness} />);

    expect(screen.getByText(/readiness confidence/i)).toBeInTheDocument();
    expect(screen.getByText(/governance: 80%/i)).toBeInTheDocument();
    expect(screen.getByText(/constitutional integrity: 84%/i)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
