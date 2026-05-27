import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PriorityGovernancePanel } from "@/components/continuity/PriorityGovernancePanel";

describe("PriorityGovernancePanel", () => {
  it("renders prioritization governance reasons", () => {
    render(
      <PriorityGovernancePanel
        prioritization={{
          prioritizationApproved: false,
          deterministicOrderingVerified: true,
          governanceReviewRequired: true,
          containmentPriorityRequired: false,
          survivabilityPriorityRequired: false,
          recoveryQueue: [],
          blockedRecoveries: [],
          disputedRecoveries: [],
          prioritizationConfidence: 0.4,
          prioritizationReasons: ["governance_review_required"],
          starvationWarnings: [],
          assessments: [],
          timestamp: "2026-05-09T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText(/governance_review_required/i)).toBeInTheDocument();
  });
});
