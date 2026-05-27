import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DivergenceDetectionPanel } from "@/components/continuity/DivergenceDetectionPanel";

describe("DivergenceDetectionPanel", () => {
  it("renders divergence reasons and disputes", () => {
    render(
      <DivergenceDetectionPanel
        convergence={{
          converged: false,
          state: "DISPUTED",
          divergenceScore: 0.7,
          divergenceReasons: ["replay_divergence_detected", "governance_divergence_detected"],
          requiresContainment: true,
          requiresEscalation: true,
          requiresFreeze: true,
          continuityConfidence: 0.3,
          replayConfidence: 0.2,
          survivabilityConfidence: 0.25,
          escalationStabilityConfidence: 0.2,
          affectedExecutions: ["execution_1"],
          affectedSubsystems: ["replay", "governance"],
          orphanedOperations: ["blocked:execution_1"],
          staleOwnershipClaims: [],
          unresolvedDisputes: ["RECOVERY_TRUTH_DISPUTED"],
          unstableDependencies: ["workers"],
          evidence: ["audit_1"],
          timestamp: "2026-05-09T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText(/replay_divergence_detected/i)).toBeInTheDocument();
    expect(screen.getByText(/unresolved disputes: 1/i)).toBeInTheDocument();
  });
});
