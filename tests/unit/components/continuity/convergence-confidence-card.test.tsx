import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ConvergenceConfidenceCard } from "@/components/continuity/ConvergenceConfidenceCard";

describe("ConvergenceConfidenceCard", () => {
  it("renders confidence values", () => {
    render(
      <ConvergenceConfidenceCard
        convergence={{
          converged: true,
          state: "CONVERGED",
          divergenceScore: 0.1,
          divergenceReasons: [],
          requiresContainment: false,
          requiresEscalation: false,
          requiresFreeze: false,
          continuityConfidence: 0.88,
          replayConfidence: 0.9,
          survivabilityConfidence: 0.86,
          escalationStabilityConfidence: 0.82,
          affectedExecutions: [],
          affectedSubsystems: [],
          orphanedOperations: [],
          staleOwnershipClaims: [],
          unresolvedDisputes: [],
          unstableDependencies: [],
          evidence: ["audit_1"],
          timestamp: "2026-05-09T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText(/continuity confidence: 88%/i)).toBeInTheDocument();
  });
});
