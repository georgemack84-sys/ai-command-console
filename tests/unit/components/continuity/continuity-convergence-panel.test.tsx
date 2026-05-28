import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ContinuityConvergencePanel } from "@/components/continuity/ContinuityConvergencePanel";

describe("ContinuityConvergencePanel", () => {
  it("renders read-only convergence state", () => {
    render(
      <ContinuityConvergencePanel
        convergence={{
          converged: false,
          state: "DRIFTING",
          divergenceScore: 0.42,
          divergenceReasons: ["continuity_drift_detected"],
          requiresContainment: false,
          requiresEscalation: true,
          requiresFreeze: false,
          continuityConfidence: 0.6,
          replayConfidence: 0.7,
          survivabilityConfidence: 0.64,
          escalationStabilityConfidence: 0.58,
          affectedExecutions: ["execution_1"],
          affectedSubsystems: ["workers"],
          orphanedOperations: [],
          staleOwnershipClaims: [],
          unresolvedDisputes: [],
          unstableDependencies: ["workers"],
          evidence: ["audit_1"],
          timestamp: "2026-05-09T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText(/drifting/i)).toBeInTheDocument();
    expect(screen.getByText(/escalation: recommended/i)).toBeInTheDocument();
  });
});
