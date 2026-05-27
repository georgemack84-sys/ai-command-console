import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RecoveryPriorityQueuePanel } from "@/components/continuity/RecoveryPriorityQueuePanel";

describe("RecoveryPriorityQueuePanel", () => {
  it("renders ranked recovery candidates read-only", () => {
    render(
      <RecoveryPriorityQueuePanel
        prioritization={{
          prioritizationApproved: true,
          deterministicOrderingVerified: true,
          governanceReviewRequired: false,
          containmentPriorityRequired: false,
          survivabilityPriorityRequired: true,
          recoveryQueue: ["exec_1", "exec_2"],
          blockedRecoveries: ["exec_3"],
          disputedRecoveries: [],
          prioritizationConfidence: 0.8,
          prioritizationReasons: ["survivability_impact_elevated"],
          starvationWarnings: [],
          assessments: [],
          timestamp: "2026-05-09T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText(/exec_1, exec_2/i)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
