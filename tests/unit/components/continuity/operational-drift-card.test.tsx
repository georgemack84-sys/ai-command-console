import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OperationalDriftCard } from "@/components/continuity/OperationalDriftCard";

describe("OperationalDriftCard", () => {
  it("renders drift-related counts and confidence", () => {
    render(
      <OperationalDriftCard
        convergence={{
          converged: false,
          state: "UNSTABLE",
          divergenceScore: 0.6,
          divergenceReasons: [],
          requiresContainment: true,
          requiresEscalation: true,
          requiresFreeze: false,
          continuityConfidence: 0.44,
          replayConfidence: 0.33,
          survivabilityConfidence: 0.28,
          escalationStabilityConfidence: 0.31,
          affectedExecutions: ["execution_1"],
          affectedSubsystems: ["replay"],
          orphanedOperations: ["blocked:execution_1", "stale-lease:execution_2"],
          staleOwnershipClaims: ["execution_2:worker_1"],
          unresolvedDisputes: [],
          unstableDependencies: ["workers", "db"],
          evidence: ["audit_1"],
          timestamp: "2026-05-09T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText(/orphaned operations: 2/i)).toBeInTheDocument();
    expect(screen.getByText(/unstable dependencies: 2/i)).toBeInTheDocument();
  });
});
