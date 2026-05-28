import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ContinuityConvergenceCard } from "@/components/stewardship/ContinuityConvergenceCard";

describe("ContinuityConvergenceCard", () => {
  it("renders divergence reasons read-only", () => {
    render(
      <ContinuityConvergenceCard
        convergence={{
          converged: false,
          divergenceScore: 0.81,
          divergenceReasons: ["replay_divergence", "stale_ownership"],
          requiresContainment: true,
          requiresEscalation: true,
          continuityConfidence: 0.22,
        }}
      />,
    );

    expect(screen.getByText(/replay_divergence, stale_ownership/i)).toBeInTheDocument();
  });
});
