import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PrioritizationConfidenceCard } from "@/components/continuity/PrioritizationConfidenceCard";

describe("PrioritizationConfidenceCard", () => {
  it("renders prioritization confidence and governance review status", () => {
    render(
      <PrioritizationConfidenceCard
        prioritization={{
          prioritizationApproved: true,
          deterministicOrderingVerified: true,
          governanceReviewRequired: true,
          containmentPriorityRequired: false,
          survivabilityPriorityRequired: true,
          recoveryQueue: [],
          blockedRecoveries: [],
          disputedRecoveries: [],
          prioritizationConfidence: 0.76,
          prioritizationReasons: [],
          starvationWarnings: [],
          assessments: [],
          timestamp: "2026-05-09T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText(/76%/i)).toBeInTheDocument();
    expect(screen.getByText(/governance review: required/i)).toBeInTheDocument();
  });
});
