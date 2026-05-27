import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RecoveryStarvationCard } from "@/components/continuity/RecoveryStarvationCard";

describe("RecoveryStarvationCard", () => {
  it("renders starvation warnings without action controls", () => {
    render(
      <RecoveryStarvationCard
        prioritization={{
          prioritizationApproved: false,
          deterministicOrderingVerified: true,
          governanceReviewRequired: true,
          containmentPriorityRequired: false,
          survivabilityPriorityRequired: true,
          recoveryQueue: [],
          blockedRecoveries: [],
          disputedRecoveries: [],
          prioritizationConfidence: 0.5,
          prioritizationReasons: [],
          starvationWarnings: ["survivability_critical_deferred:exec_1"],
          assessments: [],
          timestamp: "2026-05-09T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText(/survivability_critical_deferred:exec_1/i)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
